from pydantic import BaseModel, EmailStr
from typing import Optional

# مخطط مشترك للبيانات الأساسية
class UserBase(BaseModel):
    email: EmailStr

# المخطط المطلوب عند إنشاء حساب جديد (SignUp)
class UserCreate(UserBase):
    password: str

# المخطط المطلوب عند تسجيل الدخول (Login)
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# المخطط اللي غايرجع للـ React بعد نجاح العملية (مكتصيفطش فيه الباسورد للأمان ⚠️)
class UserResponse(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True

# 🔄 المخطط الجديد المسؤول عن تحديث بيانات المستخدم (تمت إضافته لإصلاح الـ Edit)
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None  # 👈 هادا هو السر اللي غايخلي الـ role يتبدل دابا!