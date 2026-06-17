from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app import models


def get_company_scoped_query(query, current_user: dict):
    company_id = current_user.get("company_id")
    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre compte n'est rattaché à aucune company.",
        )
    return query.filter(models.User.company_id == company_id)


def load_user_for_company(db: Session, user_id: int, company_id: int) -> models.User | None:
    return (
        db.query(models.User)
        .filter(models.User.id == user_id, models.User.company_id == company_id)
        .first()
    )