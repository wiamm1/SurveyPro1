from __future__ import annotations

from typing import Iterable

from app.core.roles import UserRole

PERMISSION_LIST = [
    "surveys:create",
    "surveys:read",
    "surveys:update",
    "surveys:delete",
    "surveys:publish",
    "invitations:create",
    "invitations:read",
    "invitations:send",
    "campaigns:create",
    "campaigns:read",
    "analytics:read",
    "analytics:export",
    "templates:read",
    "templates:manage",
    "branding:manage",
    "automations:manage",
    "webhooks:manage",
    "users:invite",
    "users:read",
    "users:update_role",
    "users:deactivate",
    "settings:manage",
]

ROLE_PERMISSIONS: dict[UserRole, set[str]] = {
    UserRole.admin: set(PERMISSION_LIST),
    UserRole.analyst: {
        "surveys:create",
        "surveys:read",
        "surveys:update",
        "surveys:delete",
        "surveys:publish",
        "invitations:create",
        "invitations:read",
        "invitations:send",
        "campaigns:create",
        "campaigns:read",
        "analytics:read",
        "analytics:export",
        "templates:read",
        "users:read",
    },
    UserRole.viewer: {
        "surveys:read",
        "analytics:read",
        "templates:read",
        "invitations:read",
    },
}


def normalize_role(role: str | UserRole) -> UserRole:
    if isinstance(role, UserRole):
        return role
    return UserRole(role)


def get_permissions_for_role(role: str | UserRole) -> list[str]:
    normalized_role = normalize_role(role)
    return sorted(ROLE_PERMISSIONS.get(normalized_role, set()))


def has_permission(role: str | UserRole, permission: str) -> bool:
    normalized_role = normalize_role(role)
    return permission in ROLE_PERMISSIONS.get(normalized_role, set())


def expand_permissions(permissions: Iterable[str]) -> list[str]:
    return sorted(set(permissions))
