from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.core.permissions import has_permission
from app.core.rbac import verify_company_ownership


SURVEY_MANAGE_ROLES = {"admin", "analyst"}


def _ensure_manage_rights(current_user: dict[str, Any]) -> None:
    if current_user.get("role") not in SURVEY_MANAGE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas les droits nécessaires pour effectuer cette action.",
        )


def _normalize_order_index(order_index: int, items_count: int) -> int:
    if order_index < 0:
        return 0
    if order_index > items_count:
        return items_count
    return order_index


def _serialize_option(option: models.QuestionOption) -> dict[str, Any]:
    return {
        "id": option.id,
        "text": option.text,
        "order_index": option.order_index,
    }


def _serialize_question(question: models.Question) -> dict[str, Any]:
    return {
        "id": question.id,
        "section_id": question.section_id,
        "survey_id": question.survey_id,
        "text": question.text,
        "type": question.type,
        "is_required": question.is_required,
        "order_index": question.order_index,
        "settings": question.settings or {},
        "created_at": question.created_at,
        "options": [_serialize_option(option) for option in question.options],
    }


def _serialize_section(section: models.Section) -> dict[str, Any]:
    return {
        "id": section.id,
        "survey_id": section.survey_id,
        "title": section.title,
        "order_index": section.order_index,
        "created_at": section.created_at,
        "questions": [_serialize_question(question) for question in section.questions],
    }


def serialize_survey(survey: models.Survey, include_sections: bool = False) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": survey.id,
        "title": survey.title,
        "description": survey.description,
        "status": survey.status,
        "company_id": survey.company_id,
        "created_by": survey.created_by,
        "template_id": survey.template_id,
        "created_at": survey.created_at,
        "updated_at": survey.updated_at,
        "sections_count": survey.sections_count or 0,
        "questions_count": survey.questions_count or 0,
    }
    if include_sections:
        payload["sections"] = [_serialize_section(section) for section in survey.sections]
    return payload


def _load_survey_for_company(db: Session, survey_id: int, current_user: dict[str, Any], include_sections: bool = False) -> models.Survey:
    query = db.query(models.Survey).filter(
        models.Survey.id == survey_id,
        models.Survey.deleted_at.is_(None),
    )
    if include_sections:
        query = query.options(
            selectinload(models.Survey.sections)
            .selectinload(models.Section.questions)
            .selectinload(models.Question.options),
            selectinload(models.Survey.sections).selectinload(models.Section.questions),
            selectinload(models.Survey.sections),
        )
    survey = query.first()
    if survey is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enquête non trouvée")
    verify_company_ownership(survey.company_id, current_user)
    return survey


def _load_section_for_company(db: Session, section_id: int, current_user: dict[str, Any]) -> models.Section:
    section = (
        db.query(models.Section)
        .join(models.Survey, models.Section.survey_id == models.Survey.id)
        .filter(models.Section.id == section_id, models.Survey.deleted_at.is_(None))
        .first()
    )
    if section is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section non trouvée")
    verify_company_ownership(section.survey.company_id, current_user)
    return section


def _load_question_for_company(db: Session, question_id: int, current_user: dict[str, Any]) -> models.Question:
    question = (
        db.query(models.Question)
        .join(models.Survey, models.Question.survey_id == models.Survey.id)
        .filter(models.Question.id == question_id, models.Survey.deleted_at.is_(None))
        .options(selectinload(models.Question.options))
        .first()
    )
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question non trouvée")
    verify_company_ownership(question.survey.company_id, current_user)
    return question


def _reindex_sections(db: Session, survey_id: int) -> None:
    sections = (
        db.query(models.Section)
        .filter(models.Section.survey_id == survey_id)
        .order_by(models.Section.order_index.asc(), models.Section.id.asc())
        .all()
    )
    for index, section in enumerate(sections):
        section.order_index = index


def _reindex_questions(db: Session, section_id: int) -> None:
    questions = (
        db.query(models.Question)
        .filter(models.Question.section_id == section_id)
        .order_by(models.Question.order_index.asc(), models.Question.id.asc())
        .all()
    )
    for index, question in enumerate(questions):
        question.order_index = index


def _reindex_options(db: Session, question_id: int) -> None:
    options = (
        db.query(models.QuestionOption)
        .filter(models.QuestionOption.question_id == question_id)
        .order_by(models.QuestionOption.order_index.asc(), models.QuestionOption.id.asc())
        .all()
    )
    for index, option in enumerate(options):
        option.order_index = index


def _refresh_counters(db: Session, survey_id: int) -> None:
    sections_count = (
        db.query(func.count(models.Section.id))
        .filter(models.Section.survey_id == survey_id)
        .scalar()
        or 0
    )
    questions_count = (
        db.query(func.count(models.Question.id))
        .filter(models.Question.survey_id == survey_id)
        .scalar()
        or 0
    )
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if survey is not None:
        survey.sections_count = int(sections_count)
        survey.questions_count = int(questions_count)


def _survey_is_publishable(survey: models.Survey) -> None:
    if not survey.sections or not any(section.questions for section in survey.sections):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une enquête doit contenir au moins une section et une question avant publication.",
        )

    for section in survey.sections:
        for question in section.questions:
            if question.type in {models.QuestionType.radio.value, models.QuestionType.checkbox.value}:
                if len(question.options) < 2:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Les questions radio et checkbox doivent contenir au moins 2 options.",
                    )


def list_surveys(
    db: Session,
    current_user: dict[str, Any],
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    status_filter: str | None = None,
) -> dict[str, Any]:
    company_id = current_user.get("company_id")
    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre compte n'est rattaché à aucune company.",
        )

    query = db.query(models.Survey).filter(
        models.Survey.company_id == company_id,
        models.Survey.deleted_at.is_(None),
    )

    if search:
        query = query.filter(models.Survey.title.ilike(f"%{search.strip()}%"))

    if status_filter:
        query = query.filter(models.Survey.status == status_filter)

    total = query.count()
    items = (
        query.order_by(models.Survey.created_at.desc(), models.Survey.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [serialize_survey(item, include_sections=False) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def get_survey(db: Session, survey_id: int, current_user: dict[str, Any]) -> dict[str, Any]:
    survey = _load_survey_for_company(db, survey_id, current_user, include_sections=True)
    return serialize_survey(survey, include_sections=True)


def create_survey(db: Session, payload: schemas.SurveyCreate, current_user: dict[str, Any]) -> dict[str, Any]:
    _ensure_manage_rights(current_user)
    company_id = current_user.get("company_id")
    if company_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Votre compte n'est rattaché à aucune company.")

    template = None
    if payload.template_id is not None:
        template = (
            db.query(models.SurveyTemplate)
            .filter(models.SurveyTemplate.id == payload.template_id, models.SurveyTemplate.is_active.is_(True))
            .first()
        )
        if template is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template non trouvé")

    survey = models.Survey(
        title=payload.title,
        description=payload.description,
        status=models.SurveyStatus.draft.value,
        company_id=company_id,
        created_by=current_user.get("id"),
        template_id=payload.template_id,
    )
    db.add(survey)
    db.flush()

    sections_payload = payload.sections
    if not sections_payload and template is not None:
        template_structure = template.structure or {}
        sections_payload = template_structure.get("sections", []) if isinstance(template_structure, dict) else []

    for section_index, section_data in enumerate(sections_payload):
        section = models.Section(
            survey_id=survey.id,
            title=section_data.title,
            order_index=section_data.order_index if section_data.order_index is not None else section_index,
        )
        db.add(section)
        db.flush()

        for question_index, question_data in enumerate(section_data.questions):
            question = models.Question(
                section_id=section.id,
                survey_id=survey.id,
                text=question_data.text,
                type=question_data.type.value if hasattr(question_data.type, "value") else str(question_data.type),
                is_required=question_data.is_required,
                order_index=question_data.order_index if question_data.order_index is not None else question_index,
                settings=question_data.settings,
            )
            db.add(question)
            db.flush()

            for option_index, option_data in enumerate(question_data.options):
                db.add(
                    models.QuestionOption(
                        question_id=question.id,
                        text=option_data.text,
                        order_index=option_data.order_index if option_data.order_index is not None else option_index,
                    )
                )

    _refresh_counters(db, survey.id)
    db.commit()
    db.refresh(survey)
    return get_survey(db, survey.id, current_user)


def save_full_survey(db: Session, survey_id: int, payload: schemas.SurveyCreate, current_user: dict[str, Any]) -> dict[str, Any]:
    _ensure_manage_rights(current_user)
    survey = _load_survey_for_company(db, survey_id, current_user, include_sections=True)

    if payload.title:
        survey.title = payload.title
    survey.description = payload.description
    survey.template_id = payload.template_id
    survey.updated_at = datetime.utcnow()

    db.query(models.Section).filter(models.Section.survey_id == survey.id).delete(synchronize_session=False)
    db.flush()

    for section_index, section_data in enumerate(payload.sections):
        section = models.Section(
            survey_id=survey.id,
            title=section_data.title,
            order_index=section_data.order_index if section_data.order_index is not None else section_index,
        )
        db.add(section)
        db.flush()

        for question_index, question_data in enumerate(section_data.questions):
            question = models.Question(
                section_id=section.id,
                survey_id=survey.id,
                text=question_data.text,
                type=question_data.type.value if hasattr(question_data.type, "value") else str(question_data.type),
                is_required=question_data.is_required,
                order_index=question_data.order_index if question_data.order_index is not None else question_index,
                settings=question_data.settings,
            )
            db.add(question)
            db.flush()

            for option_index, option_data in enumerate(question_data.options):
                db.add(
                    models.QuestionOption(
                        question_id=question.id,
                        text=option_data.text,
                        order_index=option_data.order_index if option_data.order_index is not None else option_index,
                    )
                )

    _reindex_sections(db, survey.id)
    _refresh_counters(db, survey.id)
    db.commit()
    db.refresh(survey)
    return get_survey(db, survey.id, current_user)


def update_survey(db: Session, survey_id: int, payload: schemas.SurveyUpdate, current_user: dict[str, Any]) -> dict[str, Any]:
    _ensure_manage_rights(current_user)
    survey = _load_survey_for_company(db, survey_id, current_user, include_sections=False)

    if payload.title is not None:
        survey.title = payload.title
    if payload.description is not None:
        survey.description = payload.description
    survey.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(survey)
    return serialize_survey(survey)


def toggle_status(db: Session, survey_id: int, payload: schemas.SurveyStatusUpdate, current_user: dict[str, Any]) -> dict[str, Any]:
    _ensure_manage_rights(current_user)
    survey = _load_survey_for_company(db, survey_id, current_user, include_sections=True)

    next_status = payload.status.value if hasattr(payload.status, "value") else str(payload.status)
    if next_status == models.SurveyStatus.active.value:
        _survey_is_publishable(survey)

    survey.status = next_status
    survey.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(survey)
    return serialize_survey(survey, include_sections=True)


def duplicate_survey(db: Session, survey_id: int, current_user: dict[str, Any]) -> dict[str, Any]:
    _ensure_manage_rights(current_user)
    source = _load_survey_for_company(db, survey_id, current_user, include_sections=True)

    duplicated = models.Survey(
        title=f"{source.title} (Copy)",
        description=source.description,
        status=models.SurveyStatus.draft.value,
        company_id=source.company_id,
        created_by=current_user.get("id"),
        template_id=source.template_id,
    )
    db.add(duplicated)
    db.flush()

    for section in source.sections:
        duplicated_section = models.Section(
            survey_id=duplicated.id,
            title=section.title,
            order_index=section.order_index,
        )
        db.add(duplicated_section)
        db.flush()

        for question in section.questions:
            duplicated_question = models.Question(
                survey_id=duplicated.id,
                section_id=duplicated_section.id,
                text=question.text,
                type=question.type,
                is_required=question.is_required,
                order_index=question.order_index,
                settings=question.settings,
            )
            db.add(duplicated_question)
            db.flush()

            for option in question.options:
                db.add(
                    models.QuestionOption(
                        question_id=duplicated_question.id,
                        text=option.text,
                        order_index=option.order_index,
                    )
                )

    _refresh_counters(db, duplicated.id)
    db.commit()
    db.refresh(duplicated)
    return get_survey(db, duplicated.id, current_user)


def delete_survey(db: Session, survey_id: int, current_user: dict[str, Any]) -> None:
    _ensure_manage_rights(current_user)
    survey = _load_survey_for_company(db, survey_id, current_user, include_sections=False)

    response_count = (
        db.query(func.count(models.SurveyResponse.id))
        .filter(models.SurveyResponse.survey_id == survey.id)
        .scalar()
        or 0
    )
    if response_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette enquête contient déjà des réponses. Archivez-la au lieu de la supprimer.",
        )

    survey.deleted_at = datetime.utcnow()
    survey.status = models.SurveyStatus.inactive.value
    survey.updated_at = datetime.utcnow()
    db.commit()


def add_section(db: Session, survey_id: int, payload: schemas.SectionCreate, current_user: dict[str, Any]) -> dict[str, Any]:
    _ensure_manage_rights(current_user)
    survey = _load_survey_for_company(db, survey_id, current_user, include_sections=True)

    sections = (
        db.query(models.Section)
        .filter(models.Section.survey_id == survey.id)
        .order_by(models.Section.order_index.asc(), models.Section.id.asc())
        .all()
    )
    insert_at = _normalize_order_index(payload.order_index, len(sections))
    for section in sections[insert_at:]:
        section.order_index += 1

    section = models.Section(survey_id=survey.id, title=payload.title, order_index=insert_at)
    db.add(section)
    db.flush()

    for question_index, question_data in enumerate(payload.questions):
        question = models.Question(
            survey_id=survey.id,
            section_id=section.id,
            text=question_data.text,
            type=question_data.type.value if hasattr(question_data.type, "value") else str(question_data.type),
            is_required=question_data.is_required,
            order_index=question_data.order_index if question_data.order_index is not None else question_index,
            settings=question_data.settings,
        )
        db.add(question)
        db.flush()
        for option_index, option_data in enumerate(question_data.options):
            db.add(
                models.QuestionOption(
                    question_id=question.id,
                    text=option_data.text,
                    order_index=option_data.order_index if option_data.order_index is not None else option_index,
                )
            )

    _reindex_sections(db, survey.id)
    _refresh_counters(db, survey.id)
    db.commit()
    db.refresh(section)
    return _serialize_section(section)


def update_section(db: Session, section_id: int, payload: schemas.SectionUpdate, current_user: dict[str, Any]) -> dict[str, Any]:
    _ensure_manage_rights(current_user)
    section = _load_section_for_company(db, section_id, current_user)

    if payload.title is not None:
        section.title = payload.title
    if payload.order_index is not None:
        section.order_index = payload.order_index
        _reindex_sections(db, section.survey_id)

    db.commit()
    db.refresh(section)
    return _serialize_section(section)


def delete_section(db: Session, section_id: int, current_user: dict[str, Any]) -> None:
    _ensure_manage_rights(current_user)
    section = _load_section_for_company(db, section_id, current_user)
    survey_id = section.survey_id
    db.delete(section)
    db.flush()
    _reindex_sections(db, survey_id)
    _refresh_counters(db, survey_id)
    db.commit()


def add_question(db: Session, section_id: int, payload: schemas.QuestionCreate, current_user: dict[str, Any]) -> dict[str, Any]:
    _ensure_manage_rights(current_user)
    section = _load_section_for_company(db, section_id, current_user)

    questions = (
        db.query(models.Question)
        .filter(models.Question.section_id == section.id)
        .order_by(models.Question.order_index.asc(), models.Question.id.asc())
        .all()
    )
    insert_at = _normalize_order_index(payload.order_index, len(questions))
    for question in questions[insert_at:]:
        question.order_index += 1

    question = models.Question(
        section_id=section.id,
        survey_id=section.survey_id,
        text=payload.text,
        type=payload.type.value if hasattr(payload.type, "value") else str(payload.type),
        is_required=payload.is_required,
        order_index=insert_at,
        settings=payload.settings,
    )
    db.add(question)
    db.flush()

    if question.type in {models.QuestionType.radio.value, models.QuestionType.checkbox.value} and len(payload.options) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Les questions radio et checkbox doivent contenir au moins 2 options.",
        )

    for option_index, option_data in enumerate(payload.options):
        db.add(
            models.QuestionOption(
                question_id=question.id,
                text=option_data.text,
                order_index=option_data.order_index if option_data.order_index is not None else option_index,
            )
        )

    _reindex_questions(db, section.id)
    _refresh_counters(db, section.survey_id)
    db.commit()
    db.refresh(question)
    return _serialize_question(question)


def update_question(db: Session, question_id: int, payload: schemas.QuestionUpdate, current_user: dict[str, Any]) -> dict[str, Any]:
    _ensure_manage_rights(current_user)
    question = _load_question_for_company(db, question_id, current_user)

    if payload.text is not None:
        question.text = payload.text
    if payload.type is not None:
        question.type = payload.type.value if hasattr(payload.type, "value") else str(payload.type)
    if payload.is_required is not None:
        question.is_required = payload.is_required
    if payload.order_index is not None:
        question.order_index = payload.order_index
        _reindex_questions(db, question.section_id)
    if payload.settings is not None:
        question.settings = payload.settings

    db.commit()
    db.refresh(question)
    return _serialize_question(question)


def delete_question(db: Session, question_id: int, current_user: dict[str, Any]) -> None:
    _ensure_manage_rights(current_user)
    question = _load_question_for_company(db, question_id, current_user)
    section_id = question.section_id
    survey_id = question.survey_id
    db.delete(question)
    db.flush()
    _reindex_questions(db, section_id)
    _refresh_counters(db, survey_id)
    db.commit()


def replace_question_options(
    db: Session,
    question_id: int,
    options_payload: list[schemas.QuestionOptionCreate],
    current_user: dict[str, Any],
) -> dict[str, Any]:
    _ensure_manage_rights(current_user)
    question = _load_question_for_company(db, question_id, current_user)

    if question.type in {models.QuestionType.radio.value, models.QuestionType.checkbox.value} and len(options_payload) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Les questions radio et checkbox doivent contenir au moins 2 options.",
        )

    db.query(models.QuestionOption).filter(models.QuestionOption.question_id == question.id).delete()
    for option_index, option_data in enumerate(options_payload):
        db.add(
            models.QuestionOption(
                question_id=question.id,
                text=option_data.text,
                order_index=option_data.order_index if option_data.order_index is not None else option_index,
            )
        )

    db.flush()
    _reindex_options(db, question.id)
    db.commit()
    db.refresh(question)
    return _serialize_question(question)


def list_templates(db: Session) -> list[dict[str, Any]]:
    templates = db.query(models.SurveyTemplate).filter(models.SurveyTemplate.is_active.is_(True)).all()
    return [
        {
            "id": template.id,
            "name": template.name,
            "title": template.title,
            "description": template.description,
            "structure": template.structure,
        }
        for template in templates
    ]
