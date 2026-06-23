from app import schemas

def test_pydantic_schemas_validation():
    # Test valid section creation payload with description
    payload_dict = {
        "title": "Section Title",
        "description": "Section Description",
        "order_index": 1,
        "questions": [
            {
                "text": "How satisfied are you?",
                "type": "single_choice",
                "is_required": True,
                "order_index": 0,
                "options": [
                    {"text": "Very Satisfied", "order_index": 0},
                    {"text": "Unsatisfied", "order_index": 1}
                ],
                "conditional_rules": [
                    {
                        "condition_option_id": 12,
                        "target_question_id": 45,
                        "action": "show"
                    }
                ]
            }
        ]
    }
    
    section_create = schemas.SectionCreate(**payload_dict)
    assert section_create.title == "Section Title"
    assert section_create.description == "Section Description"
    assert len(section_create.questions) == 1
    
    question = section_create.questions[0]
    assert question.type.value == "single_choice"
    assert len(question.options) == 2
    assert len(question.conditional_rules) == 1
    assert question.conditional_rules[0].action == "show"
