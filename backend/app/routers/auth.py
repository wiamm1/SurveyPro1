from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
# ندمجو وظائف التشفير وتوليد التوكين
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/signup", response_model=schemas.UserResponse)
def signup(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. التأكد واش الإيميل ديجا مسجل
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
    
    # 2. تشفير الباسورد قبل الحفظ
    hashed_pwd = get_password_hash(user_data.password)
    
    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_pwd, 
        role="user" # المستخدم الجديد دائماً كياخد رول "user" كبداية
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # 1. البحث عن المستخدم
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    
    # 2. التحقق من وجود المستخدم وصحة الباسورد (باستخدام bcrypt)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect."
        )
    
    # 3. توليد التوكين الحقيقي مع تضمين الـ role
    access_token = create_access_token(subject=user.email, role=user.role)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email, 
            "role": user.role
        }
    }