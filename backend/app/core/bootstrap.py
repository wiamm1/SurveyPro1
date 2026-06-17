from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app import models
from app.core.roles import UserRole
from app.core.security import get_password_hash

DEFAULT_ADMIN_EMAIL = "admin@surveypro.com"
DEFAULT_ADMIN_PASSWORD = "Admin123!"
DEFAULT_COMPANY_NAME = "SurveyPro Default Company"
LEGACY_ADMIN_EMAIL = "admin@surveypro.local"


def _ensure_surveys_company_id_column(db: Session) -> None:
    bind = db.get_bind()
    if bind is None:
        return

    inspector = inspect(bind)
    survey_columns = {column["name"] for column in inspector.get_columns("surveys")}
    if "company_id" in survey_columns:
        return

    company = (
        db.query(models.Company)
        .filter(models.Company.name == DEFAULT_COMPANY_NAME)
        .first()
    )
    if company is None:
        company = models.Company(name=DEFAULT_COMPANY_NAME)
        db.add(company)
        db.flush()

    db.execute(text("ALTER TABLE surveys ADD COLUMN company_id INTEGER"))
    db.execute(
        text("UPDATE surveys SET company_id = :company_id WHERE company_id IS NULL"),
        {"company_id": company.id},
    )
    db.commit()


def _ensure_column(db: Session, table_name: str, column_name: str, column_sql: str) -> None:
    bind = db.get_bind()
    if bind is None:
        return

    inspector = inspect(bind)
    table_columns = {column["name"] for column in inspector.get_columns(table_name)}
    if column_name in table_columns:
        return

    db.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_sql}"))
    db.commit()


def _backfill_question_survey_ids(db: Session) -> None:
    bind = db.get_bind()
    if bind is None:
        return

    inspector = inspect(bind)
    question_columns = {column["name"] for column in inspector.get_columns("questions")}
    section_columns = {column["name"] for column in inspector.get_columns("sections")}
    if "survey_id" not in question_columns or "survey_id" not in section_columns:
        return

    db.execute(
        text(
            """
            UPDATE questions
            SET survey_id = sections.survey_id
            FROM sections
            WHERE questions.section_id = sections.id
              AND questions.survey_id IS NULL
            """
        )
    )
    db.commit()


def seed_default_admin(db: Session) -> None:
    existing_admin = (
        db.query(models.User)
        .filter(models.User.role == UserRole.admin)
        .first()
    )
    if existing_admin:
        if existing_admin.email == LEGACY_ADMIN_EMAIL:
            existing_admin.email = DEFAULT_ADMIN_EMAIL
            if existing_admin.company is None:
                company = (
                    db.query(models.Company)
                    .filter(models.Company.name == DEFAULT_COMPANY_NAME)
                    .first()
                )
                if company is None:
                    company = models.Company(name=DEFAULT_COMPANY_NAME)
                    db.add(company)
                    db.flush()
                existing_admin.company_id = company.id
            db.commit()
        return

    company = (
        db.query(models.Company)
        .filter(models.Company.name == DEFAULT_COMPANY_NAME)
        .first()
    )
    if company is None:
        company = models.Company(name=DEFAULT_COMPANY_NAME)
        db.add(company)
        db.flush()

    default_admin = models.User(
        name="Administrator",
        email=DEFAULT_ADMIN_EMAIL,
        hashed_password=get_password_hash(DEFAULT_ADMIN_PASSWORD),
        role=UserRole.admin,
        company_id=company.id,
        is_active=True,
    )
    db.add(default_admin)
    db.commit()


def bootstrap_schema(db: Session) -> None:
    _ensure_surveys_company_id_column(db)
    _ensure_column(db, "surveys", "created_by", "created_by INTEGER")
    _ensure_column(db, "surveys", "template_id", "template_id INTEGER")
    _ensure_column(db, "surveys", "deleted_at", "deleted_at TIMESTAMP NULL")
    _ensure_column(db, "surveys", "updated_at", "updated_at TIMESTAMP NULL")

    _ensure_column(db, "sections", "created_at", "created_at TIMESTAMP NULL")

    _ensure_column(db, "questions", "survey_id", "survey_id INTEGER")
    _ensure_column(db, "questions", "settings", "settings JSON NULL")
    _ensure_column(db, "questions", "created_at", "created_at TIMESTAMP NULL")

    _ensure_column(db, "question_options", "created_at", "created_at TIMESTAMP NULL")
    _backfill_question_survey_ids(db)
