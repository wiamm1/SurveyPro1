import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
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
    
    # Seed Company and User
    company = models.Company(name="Test Company")
    db.add(company)
    db.flush()
    
    user = models.User(
        name="Test User",
        email="test@example.com",
        role="admin",
        company_id=company.id
    )
    db.add(user)
    db.commit()
    
    yield db
    
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_section_and_question_crud(db_session):
    current_user = {
        "id": 1,
        "role": "admin",
        "company_id": 1
    }
    
    # Create empty survey first
    survey = models.Survey(
        title="Test Survey",
        company_id=1,
        created_by=1
    )
    db_session.add(survey)
    db_session.commit()
    
    # 1. Add section with description and questions
    section_payload = schemas.SectionCreate(
        title="First Section",
        description="First Section Description",
        order_index=0,
        questions=[
            schemas.QuestionCreate(
                text="Q1",
                type=schemas.QuestionType.single_choice,
                options=[
                    schemas.QuestionOptionCreate(text="Opt1"),
                    schemas.QuestionOptionCreate(text="Opt2")
                ]
            )
        ]
    )
    section1 = survey_service.add_section(db_session, survey.id, section_payload, current_user)
    assert section1["title"] == "First Section"
    assert section1["description"] == "First Section Description"
    assert len(section1["questions"]) == 1
    assert len(section1["questions"][0]["options"]) == 2
    
    # 2. Update section description
    section_update = schemas.SectionUpdate(
        title="Updated Section",
        description="New Description"
    )
    updated_sec = survey_service.update_section(db_session, section1["id"], section_update, current_user)
    assert updated_sec["title"] == "Updated Section"
    assert updated_sec["description"] == "New Description"
    
    # 3. Add question with conditional rules
    new_question_payload = schemas.QuestionCreate(
        id=-5,
        text="Q2",
        type=schemas.QuestionType.text,
        order_index=1,
        conditional_rules=[
            schemas.QuestionConditionalLogicCreate(
                condition_option_id=section1["questions"][0]["options"][0]["id"],
                target_question_id=-5,
                action="show"
            )
        ]
    )
    q2 = survey_service.add_question(db_session, section1["id"], new_question_payload, current_user)
    assert q2["text"] == "Q2"
    assert len(q2["conditional_rules"]) == 1
    assert q2["conditional_rules"][0]["condition_option_id"] == section1["questions"][0]["options"][0]["id"]
    
    # 4. Replace options (bulk update)
    options_payload = [
        schemas.QuestionOptionCreate(text="NewOpt1", order_index=0),
        schemas.QuestionOptionCreate(text="NewOpt2", order_index=1),
        schemas.QuestionOptionCreate(text="NewOpt3", order_index=2)
    ]
    updated_q1 = survey_service.replace_question_options(
        db_session,
        section1["questions"][0]["id"],
        options_payload,
        current_user
    )
    assert len(updated_q1["options"]) == 3
    assert updated_q1["options"][0]["text"] == "NewOpt1"
