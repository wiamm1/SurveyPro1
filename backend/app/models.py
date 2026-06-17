from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

from app.core.roles import UserRole

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
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="Active")  # الحالات: Active, Draft, Archived
    created_at = Column(DateTime, default=datetime.utcnow)
    sections_count = Column(Integer, default=0)
    questions_count = Column(Integer, default=0)

    # 🔄 العلاقة مع الأقسام: إذا حُذف الاستبيان تُحذف جميع أقسامه تلقائياً (CASCADE)
    sections = relationship("Section", back_populates="survey", cascade="all, delete-orphan", order_by="Section.order_index.asc()")


# =========================================================================
# 📂 3. جدول الأقسام (Sections)
# =========================================================================
class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    survey_id = Column(Integer, ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    order_index = Column(Integer, default=0) # لترتيب الأقسام في الواجهة

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
    text = Column(String, nullable=False)
    type = Column(String, nullable=False)  # الأنواع: text, radio, checkbox, rating, date
    is_required = Column(Boolean, default=False)
    order_index = Column(Integer, default=0) # لترتيب الأسئلة داخل القسم

    # 🔄 العلاقات
    section = relationship("Section", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan", order_by="QuestionOption.order_index.asc()")


# =========================================================================
# 🔘 5. جدول خيارات الأسئلة (Question Options)
# =========================================================================
class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    text = Column(String, nullable=False)
    order_index = Column(Integer, default=0) # لترتيب الخيارات (مثلا: أولاً، ثانياً...)

    # 🔄 العلاقات
    question = relationship("Question", back_populates="options")


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