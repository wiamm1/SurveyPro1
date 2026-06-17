from app.core.rbac import verify_company_ownership


def test_company_a_cannot_read_company_b_resource():
    current_user = {
        'role': 'analyst',
        'company_id': 7,
    }

    try:
        verify_company_ownership(8, current_user)
        assert False, 'Company isolation should block access'
    except Exception as exc:
        assert getattr(exc, 'status_code', None) == 404
