import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app import models, schemas
from app.services import survey_service

# SQLite in-memory engine for testing
from sqlalchemy import event

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

def test_survey_create_read_update_delete(db_session):
    current_user = {
        "id": 1,
        "role": "admin",
        "company_id": 1
    }
    
    # 1. Create survey with sections, questions, options and conditional logic
    survey_payload = schemas.SurveyCreate(
        title="Customer Satisfaction",
        description="A survey to measure customer satisfaction",
        sections=[
            schemas.SectionCreate(
                title="General Experience",
                description="General feedback about our product",
                order_index=0,
                questions=[
                    schemas.QuestionCreate(
                        id=-1, # temp client-side id
                        text="Would you recommend us?",
                        type=schemas.QuestionType.single_choice,
                        is_required=True,
                        order_index=0,
                        options=[
                            schemas.QuestionOptionCreate(id=-10, text="Yes", order_index=0),
                            schemas.QuestionOptionCreate(id=-11, text="No", order_index=1)
                        ]
                    ),
                    schemas.QuestionCreate(
                        id=-2, # temp client-side id
                        text="Why would you not recommend us?",
                        type=schemas.QuestionType.text,
                        is_required=False,
                        order_index=1,
                        options=[],
                        conditional_rules=[
                            schemas.QuestionConditionalLogicCreate(
                                condition_option_id=-11, # No option (temp id)
                                target_question_id=-2, # Why question (temp id)
                                action="show"
                            )
                        ]
                    )
                ]
            )
        ]
    )
    
    # Call create_survey
    created = survey_service.create_survey(db_session, survey_payload, current_user)
    assert created["title"] == "Customer Satisfaction"
    assert created["sections_count"] == 1
    assert created["questions_count"] == 2
    
    # Check sections
    sections = created["sections"]
    assert len(sections) == 1
    assert sections[0]["description"] == "General feedback about our product"
    
    # Check question options and conditional rules
    questions = sections[0]["questions"]
    assert len(questions) == 2
    
    q1 = questions[0]
    q2 = questions[1]
    assert len(q1["options"]) == 2
    assert len(q2["conditional_rules"]) == 1
    
    rule = q2["conditional_rules"][0]
    # Check that database resolved the temporary IDs to real database IDs!
    assert rule["target_question_id"] == q2["id"]
    assert rule["condition_option_id"] == q1["options"][1]["id"]
    
    # 2. Update Survey
    update_payload = schemas.SurveyUpdate(
        title="Updated Title",
        description="Updated Description"
    )
    updated = survey_service.update_survey(db_session, created["id"], update_payload, current_user)
    assert updated["title"] == "Updated Title"
    assert updated["description"] == "Updated Description"
    
    # 3. Save Full Survey (Replace sections)
    save_full_payload = schemas.SurveyCreate(
        title="New Title",
        description="New Description",
        sections=[
            schemas.SectionCreate(
                title="New Section",
                description="New Section Description",
                questions=[]
            )
        ]
    )
    full_updated = survey_service.save_full_survey(db_session, created["id"], save_full_payload, current_user)
    assert full_updated["title"] == "New Title"
    assert full_updated["sections_count"] == 1
    assert len(full_updated["sections"][0]["questions"]) == 0
