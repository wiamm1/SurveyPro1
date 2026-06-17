from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
# استيراد role_required التي قمتِ بتعريفها في auth_utils
from app.core.auth_utils import role_required 

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"],
    # هذا السطر يحمي جميع الـ Endpoints الموجودة في هذا الملف ولا يسمح إلا للـ admin
    dependencies=[Depends(role_required("admin"))] 
)

# 1. إظهار قائمة جميع المستخدمين
@router.get("/users", response_model=list[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

# 2. تعديل دور (Role) مستخدم معين (تم تصحيحه لاستقبال Request Body)
@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, role_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    # البحث عن المستخدم في قاعدة البيانات
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # التأكد من أن الـ role الجديد مبعوث وليس فارغاً، ثم تحديثه
    if role_update.role is not None:
        user.role = role_update.role
    
    # حفظ التغييرات وتحديث الكائن في الجلسة
    db.commit()
    db.refresh(user)
    
    return {"message": f"Le rôle de {user.email} est devenu {user.role}"}

# 3. حذف مستخدم
@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    db.delete(user)
    db.commit()
    return {"message": "Utilisateur supprimé avec succès"}