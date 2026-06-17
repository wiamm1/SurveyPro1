# backend/app/routers/surveys.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.routers.auth import get_current_user  # استيراد جلب المستخدم الحالي

router = APIRouter(prefix="/api/surveys", tags=["Surveys"])

# ----------------------------
# Vérification Admin
# ----------------------------
def verify_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action non autorisée. Cet espace est réservé à l'administrateur."
        )
    return current_user

# =========================================================================
# 📝 1. Pydantic Schemas المتطابقة مع الـ React State والـ Models
# =========================================================================
class OptionSchema(BaseModel):
    text: str
    order_index: int

class QuestionSchema(BaseModel):
    text: str
    type: str
    is_required: bool
    order_index: int
    options: List[OptionSchema] = []

class SectionSchema(BaseModel):
    title: str
    order_index: int
    questions: List[QuestionSchema] = []

class SurveySaveSchema(BaseModel):
    title: str
    description: Optional[str] = None
    sections: List[SectionSchema]

class SurveyCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None


# =========================================================================
# ➕ 2. Endpoint لإنشاء استبيان جديد مع أول قسم افتراضي (مهم لـ الـ Modal)
# =========================================================================
@router.post("", status_code=status.HTTP_201_CREATED)
def create_survey(
    survey_data: SurveyCreateSchema,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(verify_admin)
):
    # 1. إنشاء الاستبيان الرئيسي
    new_survey = models.Survey(
        title=survey_data.title,
        description=survey_data.description,
        status="Active",
        sections_count=1,
        questions_count=0
    )
    db.add(new_survey)
    db.commit()
    db.refresh(new_survey)

    # 2. إنشاء أول قسم تلقائياً لكي تظهر الواجهة مهيأة فوراً فـ الـ Frontend
    default_section = models.Section(
        survey_id=new_survey.id,
        title="Section 1",
        order_index=0
    )
    db.add(default_section)
    db.commit()

    return new_survey


# =========================================================================
# 🔍 3. Endpoint لجلب معلومات الاستبيان الأساسية (العنوان والوصف)
# =========================================================================
@router.get("/{survey_id}")
def get_survey_by_id(
    survey_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(verify_admin)
):
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Enquête non trouvée")
    return survey


# =========================================================================
# 📂 4. Endpoint لجلب الهيكلية الكاملة (Sections -> Questions -> Options)
# =========================================================================
@router.get("/{survey_id}/structure")
def get_survey_structure(
    survey_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(verify_admin)
):
    # جلب الأقسام مع العلاقات التابعة لها مرتبة حسب order_index
    sections = db.query(models.Section).filter(
        models.Section.survey_id == survey_id
    ).order_index(models.Section.order_index).all()
    
    structure = []
    for section in sections:
        questions_list = []
        # جلب أسئلة كل قسم
        questions = db.query(models.Question).filter(
            models.Question.section_id == section.id
        ).order_index(models.Question.order_index).all()
        
        for q in questions:
            # جلب الاختيارات إذا كان السؤال يدعمها
            options = db.query(models.QuestionOption).filter(
                models.QuestionOption.question_id == q.id
            ).order_index(models.QuestionOption.order_index).all()
            
            questions_list.append({
                "id": q.id,
                "text": q.text,
                "type": q.type,
                "is_required": q.is_required,
                "order_index": q.order_index,
                "options": [{"id": opt.id, "text": opt.text, "order_index": opt.order_index} for opt in options]
            })
            
        structure.append({
            "id": section.id,
            "title": section.title,
            "order_index": section.order_index,
            "questions": questions_list
        })
        
    return structure


# =========================================================================
# 🔄 5. الـ Endpoint الرئيسي لحفظ وتحديث هيكلة الاستبيان بالكامل
# =========================================================================
@router.put("/{survey_id}/save", status_code=status.HTTP_200_OK)
def save_survey_structure(
    survey_id: int, 
    data: SurveySaveSchema, 
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(verify_admin)  # حماية الـ Endpoint
):
    
    # 1. التأكد من وجود الاستبيان فـ قاعدة البيانات عبر models.Survey
    survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Enquête non trouvée")
    
    # 2. تحديث العناوين الرئيسية للـ Enquête إذا تغيرت فـ الفوق
    survey.title = data.title
    survey.description = data.description
    
    try:
        # 3. مسح الأقسام القديمة كاملة التابعة لهاد الـ Survey عبر models.Section
        db.query(models.Section).filter(models.Section.survey_id == survey_id).delete()
        
        # حواسب الحساب (Counters) للـ Survey
        total_sections = 0
        total_questions = 0
        
        # 4. إعادة بناء الهيكلة الجديدة خطوة بخطوة (Sections -> Questions -> Options)
        for s_idx, sec_data in enumerate(data.sections):
            db_section = models.Section(
                survey_id=survey_id,
                title=sec_data.title if sec_data.title.strip() else f"Section {s_idx + 1}",
                order_index=sec_data.order_index
            )
            db.add(db_section)
            db.flush()  # توليد id للقسم الجديد قبل الـ commit
            total_sections += 1
            
            for q_idx, q_data in enumerate(sec_data.questions):
                db_question = models.Question(
                    section_id=db_section.id,
                    text=q_data.text,
                    type=q_data.type,
                    is_required=q_data.is_required,
                    order_index=q_data.order_index
                )
                db.add(db_question)
                db.flush()  # توليد id للسؤال قبل إضافة الخيارات
                total_questions += 1
                
                # إضافة الخيارات فقط إذا كان نوع السؤال يدعم ذلك (radio أو checkbox)
                if q_data.type in ["radio", "checkbox"] and q_data.options:
                    for o_idx, opt_data in enumerate(q_data.options):
                        db_option = models.QuestionOption(
                            question_id=db_question.id,
                            text=opt_data.text,
                            order_index=opt_data.order_index
                        )
                        db.add(db_option)
        
        # تحديث الـ counters المتواجدة بجدول الـ Survey
        survey.sections_count = total_sections
        survey.questions_count = total_questions
        
        # حفظ التغييرات نهائياً فـ قاعدة البيانات
        db.commit()
        
        return {
            "status": "success",
            "message": "Structure de l'enquête enregistrée avec succès !",
            "sections_count": total_sections,
            "questions_count": total_questions
        }
        
    except Exception as e:
        db.rollback()  # تراجع عن التعديلات يلا وقع شي خطأ فـ الـ Loop
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne lors de l'enregistrement: {str(e)}"
        )