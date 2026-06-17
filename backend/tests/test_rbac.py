from fastapi import HTTPException

from app.core.rbac import require_permission, verify_company_ownership


def test_viewer_cannot_post_permission():
    dependency = require_permission('surveys:create')
    viewer = {
        'role': 'viewer',
        'company_id': 1,
    }

    try:
        dependency(current_user=viewer)
        assert False, 'Viewer should not be allowed to create surveys'
    except HTTPException as exc:
        assert exc.status_code == 403


def test_company_isolation_blocks_foreign_resource():
    current_user = {
        'role': 'admin',
        'company_id': 1,
    }

    try:
        verify_company_ownership(2, current_user)
        assert False, 'Foreign company resource should be blocked'
    except HTTPException as exc:
        assert exc.status_code == 404
