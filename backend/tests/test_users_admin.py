from types import SimpleNamespace

from fastapi import HTTPException

from app.core.roles import UserRole
from app.routers import users as users_router


def test_admin_cannot_deactivate_self(monkeypatch):
    current_user = {
        'id': 1,
        'role': 'admin',
        'company_id': 10,
    }

    fake_target = SimpleNamespace(id=1, role=UserRole.admin, company_id=10, is_active=True, email='admin@example.com')
    monkeypatch.setattr(users_router, '_get_user_by_id_for_company', lambda db, user_id, company_id: fake_target)
    monkeypatch.setattr(users_router.users_service, 'get_active_admin_count', lambda db, company_id: 1)

    try:
        users_router.change_user_status(
            user_id=1,
            payload=SimpleNamespace(is_active=False),
            current_user=current_user,
            db=None,
        )
        assert False, 'Self-deactivation must be blocked'
    except HTTPException as exc:
        assert exc.status_code == 400
        assert 'désactiver votre propre compte' in exc.detail
