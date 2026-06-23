from app import models

def test_models_structure():
    # Verify QuestionType Enum
    assert hasattr(models.QuestionType, "single_choice")
    assert hasattr(models.QuestionType, "multiple_choice")
    assert hasattr(models.QuestionType, "text")
    assert hasattr(models.QuestionType, "scale")
    assert hasattr(models.QuestionType, "matrix")
    assert hasattr(models.QuestionType, "date")
    
    assert models.QuestionType.single_choice.value == "single_choice"
    assert models.QuestionType.multiple_choice.value == "multiple_choice"

    # Verify Section has description column
    assert hasattr(models.Section, "description")
    
    # Verify Question has conditional_rules relationship
    assert hasattr(models.Question, "conditional_rules")
    
    # Verify QuestionConditionalLogic exists and has proper attributes
    assert hasattr(models.QuestionConditionalLogic, "id")
    assert hasattr(models.QuestionConditionalLogic, "question_id")
    assert hasattr(models.QuestionConditionalLogic, "condition_option_id")
    assert hasattr(models.QuestionConditionalLogic, "target_question_id")
    assert hasattr(models.QuestionConditionalLogic, "action")
