from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.security import get_password_hash  # 👈 هذا هو السطر الناقص والضروري جداً!

# كلاس يمثل البيانات
class User(BaseModel):
    id: int
    email: EmailStr
    role: str  # Admin, Analyst, Viewer, Client
    is_active: bool = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# قاعدة بيانات وهمية (تم تفعيل الـ hashing بنجاح هنا ✅)
FAKE_USERS_DB = [
    {
        "id": 1,
        "email": "admin@surveypro.com",
        "hashed_password": get_password_hash("password123"),  
        "role": "Admin",
        "is_active": True
    },
    {
        "id": 2,
        "email": "analyst@surveypro.com",
        "hashed_password": get_password_hash("analyst123"),
        "role": "Analyst",
        "is_active": True
    }
]