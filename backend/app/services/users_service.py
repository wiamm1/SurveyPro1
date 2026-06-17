from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from secrets import token_urlsafe

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.core.permissions import get_permissions_for_role
from app.core.roles import UserRole


@dataclass(frozen=True)
class InvitationResult:
    invitation: models.Invitation
    activation_url: str


def _normalize_role(role: str) -> UserRole:
    try:
        return UserRole(role)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rôle invalide.") from exc


def list_company_users(db: Session, company_id: int) -> list[models.User]:
    return (
        db.query(models.User)
        .filter(models.User.company_id == company_id)
        .order_by(models.User.created_at.desc())
        .all()
    )


def invite_user(db: Session, company_id: int, email: str, role: str) -> InvitationResult:
    normalized_role = _normalize_role(role)
    existing = (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )
    if existing and existing.company_id == company_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cet utilisateur existe déjà dans votre company.")

    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company introuvable.")

    invitation = models.Invitation(
        email=email,
        company_id=company_id,
        role=normalized_role,
        token=token_urlsafe(32),
        sent=False,
        created_at=datetime.utcnow(),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    activation_url = f"/invite/accept?token={invitation.token}"
    return InvitationResult(invitation=invitation, activation_url=activation_url)


def get_active_admin_count(db: Session, company_id: int) -> int:
    return (
        db.query(models.User)
        .filter(
            models.User.company_id == company_id,
            models.User.role == UserRole.admin,
            models.User.is_active.is_(True),
        )
        .count()
    )


def update_user_role(db: Session, user: models.User, role: str) -> models.User:
    normalized_role = _normalize_role(role)
    user.role = normalized_role
    db.commit()
    db.refresh(user)
    return user


def update_user_status(db: Session, user: models.User, is_active: bool) -> models.User:
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: models.User) -> None:
    db.delete(user)
    db.commit()


def resolve_permissions(user: models.User) -> list[str]:
    return get_permissions_for_role(user.role)