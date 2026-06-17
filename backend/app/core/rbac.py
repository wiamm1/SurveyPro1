from __future__ import annotations

from collections.abc import Callable
from typing import Any

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.core.permissions import get_permissions_for_role, has_permission
from app.core.roles import UserRole


def require_role(required_role: str) -> Callable[..., dict[str, Any]]:
    def dependency(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        if current_user["role"] != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas les droits nécessaires pour effectuer cette action.",
            )
        return current_user

    return dependency


def require_permission(permission: str) -> Callable[..., dict[str, Any]]:
    def dependency(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        if not has_permission(current_user["role"], permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas la permission requise pour cette action.",
            )
        return current_user

    return dependency


def require_any_permission(permissions: list[str]) -> Callable[..., dict[str, Any]]:
    def dependency(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        if not any(has_permission(current_user["role"], permission) for permission in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas la permission requise pour cette action.",
            )
        return current_user

    return dependency


def get_current_company_id(current_user: dict[str, Any] = Depends(get_current_user)) -> int:
    company_id = current_user.get("company_id")
    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre compte n'est rattaché à aucune company.",
        )
    return int(company_id)


def verify_company_ownership(resource_company_id: int | None, current_user: dict[str, Any]) -> None:
    if resource_company_id is None or current_user.get("company_id") is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ressource introuvable.")
    if int(resource_company_id) != int(current_user["company_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ressource introuvable.")


def current_user_permissions(current_user: dict[str, Any]) -> list[str]:
    return get_permissions_for_role(UserRole(current_user["role"]))