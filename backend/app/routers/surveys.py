from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app import schemas
from app.core.rbac import require_permission
from app.database import get_db
from app.services import survey_service

router = APIRouter(prefix="/api/surveys", tags=["Surveys"])


@router.get("", response_model=schemas.SurveyListResponse)
def list_surveys(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    current_user: dict = Depends(require_permission("surveys:read")),
    db: Session = Depends(get_db),
):
    return survey_service.list_surveys(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        search=search,
        status_filter=status_filter,
    )


@router.post("", response_model=schemas.SurveyFullResponse, status_code=status.HTTP_201_CREATED)
def create_survey(
    payload: schemas.SurveyCreate,
    current_user: dict = Depends(require_permission("surveys:create")),
    db: Session = Depends(get_db),
):
    return survey_service.create_survey(db=db, payload=payload, current_user=current_user)


@router.get("/templates")
def list_templates(
    current_user: dict = Depends(require_permission("templates:read")),
    db: Session = Depends(get_db),
):
    return survey_service.list_templates(db=db)


@router.get("/{survey_id}", response_model=schemas.SurveyFullResponse)
def get_survey(
    survey_id: int,
    current_user: dict = Depends(require_permission("surveys:read")),
    db: Session = Depends(get_db),
):
    return survey_service.get_survey(db=db, survey_id=survey_id, current_user=current_user)


@router.put("/{survey_id}", response_model=schemas.SurveyResponse)
def update_survey(
    survey_id: int,
    payload: schemas.SurveyUpdate,
    current_user: dict = Depends(require_permission("surveys:update")),
    db: Session = Depends(get_db),
):
    return survey_service.update_survey(db=db, survey_id=survey_id, payload=payload, current_user=current_user)


@router.put("/{survey_id}/full", response_model=schemas.SurveyFullResponse)
def save_full_survey(
    survey_id: int,
    payload: schemas.SurveyCreate,
    current_user: dict = Depends(require_permission("surveys:update")),
    db: Session = Depends(get_db),
):
    return survey_service.save_full_survey(db=db, survey_id=survey_id, payload=payload, current_user=current_user)


@router.patch("/{survey_id}/status", response_model=schemas.SurveyFullResponse)
def toggle_status(
    survey_id: int,
    payload: schemas.SurveyStatusUpdate,
    current_user: dict = Depends(require_permission("surveys:publish")),
    db: Session = Depends(get_db),
):
    return survey_service.toggle_status(db=db, survey_id=survey_id, payload=payload, current_user=current_user)


@router.post("/{survey_id}/duplicate", response_model=schemas.SurveyFullResponse, status_code=status.HTTP_201_CREATED)
def duplicate_survey(
    survey_id: int,
    current_user: dict = Depends(require_permission("surveys:create")),
    db: Session = Depends(get_db),
):
    return survey_service.duplicate_survey(db=db, survey_id=survey_id, current_user=current_user)


@router.delete("/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_survey(
    survey_id: int,
    current_user: dict = Depends(require_permission("surveys:delete")),
    db: Session = Depends(get_db),
):
    survey_service.delete_survey(db=db, survey_id=survey_id, current_user=current_user)
    return None


@router.post("/{survey_id}/sections", response_model=schemas.SectionResponse, status_code=status.HTTP_201_CREATED)
def add_section(
    survey_id: int,
    payload: schemas.SectionCreate,
    current_user: dict = Depends(require_permission("surveys:update")),
    db: Session = Depends(get_db),
):
    return survey_service.add_section(db=db, survey_id=survey_id, payload=payload, current_user=current_user)


@router.put("/sections/{section_id}", response_model=schemas.SectionResponse)
def update_section(
    section_id: int,
    payload: schemas.SectionUpdate,
    current_user: dict = Depends(require_permission("surveys:update")),
    db: Session = Depends(get_db),
):
    return survey_service.update_section(db=db, section_id=section_id, payload=payload, current_user=current_user)


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_section(
    section_id: int,
    current_user: dict = Depends(require_permission("surveys:update")),
    db: Session = Depends(get_db),
):
    survey_service.delete_section(db=db, section_id=section_id, current_user=current_user)
    return None


@router.post("/sections/{section_id}/questions", response_model=schemas.QuestionResponse, status_code=status.HTTP_201_CREATED)
def add_question(
    section_id: int,
    payload: schemas.QuestionCreate,
    current_user: dict = Depends(require_permission("surveys:update")),
    db: Session = Depends(get_db),
):
    return survey_service.add_question(db=db, section_id=section_id, payload=payload, current_user=current_user)


@router.put("/questions/{question_id}", response_model=schemas.QuestionResponse)
def update_question(
    question_id: int,
    payload: schemas.QuestionUpdate,
    current_user: dict = Depends(require_permission("surveys:update")),
    db: Session = Depends(get_db),
):
    return survey_service.update_question(db=db, question_id=question_id, payload=payload, current_user=current_user)


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    current_user: dict = Depends(require_permission("surveys:update")),
    db: Session = Depends(get_db),
):
    survey_service.delete_question(db=db, question_id=question_id, current_user=current_user)
    return None


@router.put("/questions/{question_id}/options", response_model=schemas.QuestionResponse)
def replace_question_options(
    question_id: int,
    payload: list[schemas.QuestionOptionCreate],
    current_user: dict = Depends(require_permission("surveys:update")),
    db: Session = Depends(get_db),
):
    return survey_service.replace_question_options(db=db, question_id=question_id, options_payload=payload, current_user=current_user)