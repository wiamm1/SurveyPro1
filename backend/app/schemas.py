from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field

from app.models import QuestionType, SurveyStatus


class RolePermissionSummary(BaseModel):
    role: str
    permissions: list[str]

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
    name: Optional[str] = None
    role: str
    company_id: Optional[int] = None
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True

# 🔄 المخطط الجديد المسؤول عن تحديث بيانات المستخدم (تمت إضافته لإصلاح الـ Edit)
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None  # 👈 هادا هو السر اللي غايخلي الـ role يتبدل دابا!


class UserInvite(BaseModel):
    email: EmailStr
    role: str = "viewer"


class UserStatusUpdate(BaseModel):
    is_active: bool


class QuestionOptionCreate(BaseModel):
    id: Optional[int] = None
    text: str
    order_index: int = 0


class QuestionOptionResponse(QuestionOptionCreate):
    id: int

    class Config:
        from_attributes = True


class QuestionConditionalLogicCreate(BaseModel):
    condition_option_id: Optional[int] = None
    target_question_id: int
    action: str  # "show" ou "skip_to"


class QuestionConditionalLogicResponse(QuestionConditionalLogicCreate):
    id: int
    question_id: int

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    id: Optional[int] = None
    text: str
    type: QuestionType
    is_required: bool = False
    order_index: int = 0
    settings: dict[str, Any] | None = None
    options: list[QuestionOptionCreate] = Field(default_factory=list)
    conditional_rules: list[QuestionConditionalLogicCreate] = Field(default_factory=list)


class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    type: Optional[QuestionType] = None
    is_required: Optional[bool] = None
    order_index: Optional[int] = None
    settings: dict[str, Any] | None = None


class QuestionResponse(QuestionCreate):
    id: int
    section_id: int
    survey_id: int
    options: list[QuestionOptionResponse] = Field(default_factory=list)
    conditional_rules: list[QuestionConditionalLogicResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class SectionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order_index: int = 0
    questions: list[QuestionCreate] = Field(default_factory=list)


class SectionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None


class SectionResponse(SectionCreate):
    id: int
    survey_id: int
    questions: list[QuestionResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class SurveyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    template_id: Optional[int] = None
    sections: list[SectionCreate] = Field(default_factory=list)


class SurveyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class SurveyStatusUpdate(BaseModel):
    status: SurveyStatus


class SurveyResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: SurveyStatus
    company_id: Optional[int] = None
    created_by: Optional[int] = None
    template_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    sections_count: int = 0
    questions_count: int = 0

    class Config:
        from_attributes = True


class SurveyFullResponse(SurveyResponse):
    sections: list[SectionResponse] = Field(default_factory=list)


class SurveyListResponse(BaseModel):
    items: list[SurveyResponse]
    total: int
    page: int
    page_size: int


class SurveyDuplicateResponse(BaseModel):
    id: int
    title: str


class SurveyTemplateResponse(BaseModel):
    id: int
    name: str
    title: str
    description: Optional[str] = None
    structure: dict[str, Any]

    class Config:
        from_attributes = True