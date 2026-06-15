from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
# قمنا باستيراد role_required التي قمتِ بتعريفها في auth_utils
from app.core.auth_utils import role_required 

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"],
    # هذا السطر يحمي جميع الـ Endpoints الموجودة في هذا الملف
    dependencies=[Depends(role_required("admin"))] 
)

# 1. إظهار قائمة جميع المستخدمين
@router.get("/users", response_model=list[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

# 2. تعديل دور (Role) مستخدم معين
@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, new_role: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user.role = new_role
    db.commit()
    return {"message": f"Le rôle de {user.email} est devenu {new_role}"}

# 3. حذف مستخدم
@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    db.delete(user)
    db.commit()
    return {"message": "Utilisateur supprimé avec succès"}