import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from app.database import Base
from app import models, schemas
from app.services import survey_service

# SQLite in-memory engine for testing
engine = create_engine("sqlite:///:memory:")

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    company = models.Company(name="Test Company")
    db.add(company)
    db.flush()
    user = models.User(name="Test User", email="test@example.com", role="admin", company_id=company.id)
    db.add(user)
    db.commit()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


def _make_survey(db, current_user, with_questions=False):
    sections = []
    if with_questions:
        sections = [
            schemas.SectionCreate(
                title="Section 1",
                description="Desc",
                questions=[
                    schemas.QuestionCreate(
                        id=-1,
                        text="Q1",
                        type=schemas.QuestionType.single_choice,
                        options=[
                            schemas.QuestionOptionCreate(id=-10, text="Yes"),
                            schemas.QuestionOptionCreate(id=-11, text="No"),
                        ],
                    ),
                    schemas.QuestionCreate(
                        id=-2,
                        text="Q2 conditional",
                        type=schemas.QuestionType.text,
                        conditional_rules=[
                            schemas.QuestionConditionalLogicCreate(
                                condition_option_id=-11,
                                target_question_id=-2,
                                action="show",
                            )
                        ],
                    ),
                ],
            )
        ]
    return survey_service.create_survey(
        db,
        schemas.SurveyCreate(title="Test Survey", sections=sections),
        current_user,
    )


def test_cannot_publish_empty_survey(db_session):
    current_user = {"id": 1, "role": "admin", "company_id": 1}
    survey = _make_survey(db_session, current_user, with_questions=False)

    with pytest.raises(HTTPException) as exc_info:
        survey_service.toggle_status(
            db_session, survey["id"],
            schemas.SurveyStatusUpdate(status=schemas.SurveyStatus.active),
            current_user,
        )
    assert exc_info.value.status_code == 400
    assert "section" in exc_info.value.detail.lower() or "question" in exc_info.value.detail.lower()


def test_publish_and_unpublish(db_session):
    current_user = {"id": 1, "role": "admin", "company_id": 1}
    survey = _make_survey(db_session, current_user, with_questions=True)

    # Publish
    published = survey_service.toggle_status(
        db_session, survey["id"],
        schemas.SurveyStatusUpdate(status=schemas.SurveyStatus.active),
        current_user,
    )
    assert published["status"] == "active"

    # Unpublish (deactivate)
    inactive = survey_service.toggle_status(
        db_session, survey["id"],
        schemas.SurveyStatusUpdate(status=schemas.SurveyStatus.inactive),
        current_user,
    )
    assert inactive["status"] == "inactive"


def test_duplicate_survey_copies_full_tree(db_session):
    current_user = {"id": 1, "role": "admin", "company_id": 1}
    source = _make_survey(db_session, current_user, with_questions=True)

    duplicate = survey_service.duplicate_survey(db_session, source["id"], current_user)

    # Check basic properties
    assert duplicate["title"] == "Test Survey (Copie)"
    assert duplicate["status"] == "draft"
    assert duplicate["id"] != source["id"]

    # Check section structure is copied
    assert duplicate["sections_count"] == source["sections_count"]
    assert duplicate["questions_count"] == source["questions_count"]

    # Check description was copied
    src_sections = source["sections"]
    dup_sections = duplicate["sections"]
    assert dup_sections[0]["description"] == src_sections[0]["description"]

    # Check options are present
    src_q1 = src_sections[0]["questions"][0]
    dup_q1 = dup_sections[0]["questions"][0]
    assert len(dup_q1["options"]) == len(src_q1["options"])
    assert dup_q1["options"][0]["text"] == src_q1["options"][0]["text"]

    # Verify IDs are NEW (duplicated), not the same
    assert dup_q1["id"] != src_q1["id"]
    assert dup_q1["options"][0]["id"] != src_q1["options"][0]["id"]

    # Verify conditional logic was copied and remapped correctly
    src_q2 = src_sections[0]["questions"][1]
    dup_q2 = dup_sections[0]["questions"][1]
    assert len(dup_q2["conditional_rules"]) == len(src_q2["conditional_rules"])

    src_rule = src_q2["conditional_rules"][0]
    dup_rule = dup_q2["conditional_rules"][0]

    # The rule must point to the NEW duplicated question/option IDs, not the originals
    assert dup_rule["target_question_id"] == dup_q2["id"]
    assert dup_rule["target_question_id"] != src_rule["target_question_id"]
    assert dup_rule["condition_option_id"] == dup_q1["options"][1]["id"]
    assert dup_rule["condition_option_id"] != src_rule["condition_option_id"]
