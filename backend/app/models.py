from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

from app.core.roles import UserRole


class SurveyStatus(str, Enum):
    draft = "draft"
    active = "active"
    inactive = "inactive"


class QuestionType(str, Enum):
    single_choice = "single_choice"
    multiple_choice = "multiple_choice"
    text = "text"
    scale = "scale"
    matrix = "matrix"
    date = "date"

# =========================================================================
# 👤 1. جدول المستخدمين (Users)
# =========================================================================
class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.viewer, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    google_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")


# =========================================================================
# 📋 2. جدول الاستبيانات (Surveys)
# =========================================================================
class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    template_id = Column(Integer, ForeignKey("survey_templates.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default=SurveyStatus.draft.value, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    sections_count = Column(Integer, default=0)
    questions_count = Column(Integer, default=0)

    company = relationship("Company")
    creator = relationship("User", foreign_keys=[created_by])
    template = relationship("SurveyTemplate", foreign_keys=[template_id])

    # 🔄 العلاقة مع الأقسام: إذا حُذف الاستبيان تُحذف جميع أقسامه تلقائياً (CASCADE)
    sections = relationship("Section", back_populates="survey", cascade="all, delete-orphan", order_by="Section.order_index.asc()")
    questions = relationship("Question", back_populates="survey", cascade="all, delete-orphan")
    responses = relationship("SurveyResponse", back_populates="survey", cascade="all, delete-orphan")


# =========================================================================
# 📂 3. جدول الأقسام (Sections)
# =========================================================================
class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    survey_id = Column(Integer, ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True) # Description de la section
    order_index = Column(Integer, default=0) # لترتيب الأقسام في الواجهة
    created_at = Column(DateTime, default=datetime.utcnow)

    # 🔄 العلاقات
    survey = relationship("Survey", back_populates="sections")
    questions = relationship("Question", back_populates="section", cascade="all, delete-orphan", order_by="Question.order_index.asc()")


# =========================================================================
# ❓ 4. جدول الأسئلة (Questions)
# =========================================================================
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    survey_id = Column(Integer, ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False)
    text = Column(String, nullable=False)
    type = Column(String, nullable=False)  # الأنواع: text, radio, checkbox, rating, date
    is_required = Column(Boolean, default=False)
    order_index = Column(Integer, default=0) # لترتيب الأسئلة داخل القسم
    settings = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 🔄 العلاقات
    section = relationship("Section", back_populates="questions")
    survey = relationship("Survey", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan", order_by="QuestionOption.order_index.asc()")
    conditional_rules = relationship("QuestionConditionalLogic", foreign_keys="[QuestionConditionalLogic.question_id]", cascade="all, delete-orphan", back_populates="question")


# =========================================================================
# 🔘 5. جدول خيارات الأسئلة (Question Options)
# =========================================================================
class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    text = Column(String, nullable=False)
    order_index = Column(Integer, default=0) # لترتيب الخيارات (مثلا: أولاً، ثانياً...)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 🔄 العلاقات
    question = relationship("Question", back_populates="options")


# =========================================================================
# 🔀 6. جدول المنطق الشرطي للأسئلة (Question Conditional Logic)
# =========================================================================
class QuestionConditionalLogic(Base):
    __tablename__ = "question_conditional_logic"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    condition_option_id = Column(Integer, ForeignKey("question_options.id", ondelete="CASCADE"), nullable=True)
    target_question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)  # "show" ou "skip_to"

    # 🔄 العلاقات
    question = relationship("Question", foreign_keys=[question_id], back_populates="conditional_rules")
    condition_option = relationship("QuestionOption", foreign_keys=[condition_option_id])
    target_question = relationship("Question", foreign_keys=[target_question_id])


class SurveyTemplate(Base):
    __tablename__ = "survey_templates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    structure = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    survey_id = Column(Integer, ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    survey = relationship("Survey", back_populates="responses")
    company = relationship("Company")


# Invitations table (placeholder for invite flow)
class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.viewer)
    token = Column(String, nullable=False)
    sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")