from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.rbac import require_permission, require_role
from app.core.roles import UserRole
from app.database import get_db
from app.routers.auth import get_current_user
from app.services import users_service

router = APIRouter(prefix="/users", tags=["Users"])


def _get_user_by_id_for_company(db: Session, user_id: int, company_id: int) -> models.User:
    user = (
        db.query(models.User)
        .filter(models.User.id == user_id, models.User.company_id == company_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable.")
    return user


@router.get("/me")
def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user_by_id_for_company(db, current_user["id"], current_user["company_id"])
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, "value") else user.role,
        "company_id": user.company_id,
        "is_active": user.is_active,
        "permissions": users_service.resolve_permissions(user),
    }


@router.get("")
def list_users(
    current_user: dict = Depends(require_permission("users:read")),
    db: Session = Depends(get_db),
):
    company_id = current_user["company_id"]
    users = users_service.list_company_users(db, company_id)
    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, "value") else user.role,
            "company_id": user.company_id,
            "is_active": user.is_active,
            "permissions": users_service.resolve_permissions(user),
        }
        for user in users
    ]


@router.post("/invite")
def invite_user(
    payload: schemas.UserInvite,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    result = users_service.invite_user(db, current_user["company_id"], payload.email, payload.role)
    return {
        "message": "Invitation créée avec succès.",
        "invitation_id": result.invitation.id,
        "activation_url": result.activation_url,
        "email": result.invitation.email,
        "role": result.invitation.role.value if hasattr(result.invitation.role, "value") else result.invitation.role,
    }


@router.patch("/{user_id}/role")
def change_user_role(
    user_id: int,
    role_update: schemas.UserUpdate,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    target_user = _get_user_by_id_for_company(db, user_id, current_user["company_id"])
    if target_user.id == current_user["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vous ne pouvez pas modifier votre propre rôle.")
    if role_update.role is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le rôle est requis.")
    if target_user.role == UserRole.admin and users_service.get_active_admin_count(db, current_user["company_id"]) <= 1 and role_update.role != "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Il doit rester au moins un admin actif dans la company.")
    updated_user = users_service.update_user_role(db, target_user, role_update.role)
    return {
        "message": "Rôle mis à jour.",
        "user": {
            "id": updated_user.id,
            "email": updated_user.email,
            "role": updated_user.role.value if hasattr(updated_user.role, "value") else updated_user.role,
            "company_id": updated_user.company_id,
            "is_active": updated_user.is_active,
        },
    }


@router.patch("/{user_id}/status")
def change_user_status(
    user_id: int,
    payload: schemas.UserStatusUpdate,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    target_user = _get_user_by_id_for_company(db, user_id, current_user["company_id"])
    if target_user.id == current_user["id"] and payload.is_active is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vous ne pouvez pas désactiver votre propre compte.")
    if target_user.role == UserRole.admin and payload.is_active is False and users_service.get_active_admin_count(db, current_user["company_id"]) <= 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Il doit rester au moins un admin actif dans la company.")
    updated_user = users_service.update_user_status(db, target_user, payload.is_active)
    return {
        "message": "Statut mis à jour.",
        "user": {
            "id": updated_user.id,
            "email": updated_user.email,
            "role": updated_user.role.value if hasattr(updated_user.role, "value") else updated_user.role,
            "company_id": updated_user.company_id,
            "is_active": updated_user.is_active,
        },
    }


@router.delete("/{user_id}")
def remove_user(
    user_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    target_user = _get_user_by_id_for_company(db, user_id, current_user["company_id"])
    if target_user.id == current_user["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vous ne pouvez pas supprimer votre propre compte.")
    if target_user.role == UserRole.admin and users_service.get_active_admin_count(db, current_user["company_id"]) <= 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Il doit rester au moins un admin actif dans la company.")
    users_service.delete_user(db, target_user)
    return {"message": "Utilisateur supprimé avec succès."}
