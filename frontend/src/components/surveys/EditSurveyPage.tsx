import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { surveyService } from "../../services/surveyService";

// composants questions
import { TextQuestion } from "../questions/TextQuestion";
import { RadioQuestion } from "../questions/RadioQuestion";
import { CheckboxQuestion } from "../questions/CheckboxQuestion";
import { RatingQuestion } from "../questions/RatingQuestion";

export const EditSurveyPage: React.FC = () => {
  const { id: surveyId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [sections, setSections] = useState<any[]>([]);
  const [titreEnquete, setTitreEnquete] = useState("");
  const [descriptionEnquete, setDescriptionEnquete] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =========================
  // LOAD SURVEY STRUCTURE
  // =========================
  useEffect(() => {
    const fetchSurveyStructure = async () => {
      try {
        if (!surveyId) return;

        // 1. جلب معلومات الاستبيان الأساسية
        const surveyData = await surveyService.getSurveyById(surveyId);
        setTitreEnquete(surveyData.title);
        setDescriptionEnquete(surveyData.description || "");

        // 2. جلب الهيكلة الكاملة للأقسام والأسئلة
        const structureData = await surveyService.getSurveyStructure(surveyId);
        setSections(structureData || []);
      } catch (error) {
        console.error("Erreur chargement structure:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyStructure();
  }, [surveyId]);

  // =========================
  // SAVE ALL SURVEY
  // =========================
  const handleEnregistrerTout = async () => {
    try {
      if (!surveyId) return;
      setSaving(true);

      const payload = {
        title: titreEnquete,
        description: descriptionEnquete,
        sections: sections.map((sec, sIdx) => ({
          id: typeof sec.id === "number" && sec.id > 1500000000000 ? null : sec.id, // تجاهل المعرف المؤقت للباكند لإنشاء سجل جديد
          title: sec.title,
          description: sec.description || "",
          order_index: sIdx,
          questions: (sec.questions || []).map((q: any, qIdx: number) => ({
            id: typeof q.id === "number" && q.id > 1500000000000 ? null : q.id,
            text: q.text,
            type: q.type,
            is_required: q.is_required,
            order_index: qIdx,
            options: (q.options || []).map((opt: any, oIdx: number) => ({
              text: opt.text,
              order_index: oIdx,
            })),
          })),
        })),
      };

      // حفظ في الباكند واستقبال الهيكل الجديد بالمعرفات الحقيقية
      const updatedStructure = await surveyService.saveSurveyStructure(surveyId, payload);
      
      alert("Structure enregistrée avec succès 🎉");
      
      // تحديث الـ State بالبيانات الحقيقية لتجنب تكرار الـ IDs المؤقتة
      if (updatedStructure && updatedStructure.sections) {
        setSections(updatedStructure.sections);
      }

      // الرجوع للقائمة الرئيسية للاستبيانات
      navigate("/surveys");
    } catch (error) {
      console.error("Erreur save structure:", error);
      alert("Erreur lors de l'enregistrement de l'enquête.");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // SECTIONS HANDLERS
  // =========================
  const handleAjouterSection = () => {
    const newSection = {
      id: Date.now(), // ID مؤقت للـ React Key فقط
      title: `Section ${sections.length + 1}`,
      description: "",
      order_index: sections.length,
      questions: [],
    };
    setSections([...sections, newSection]);
  };

  const handleSectionTitleChange = (sIdx: number, value: string) => {
    const copy = [...sections];
    copy[sIdx].title = value;
    setSections(copy);
  };

  const handleSectionDescriptionChange = (sIdx: number, value: string) => {
    const copy = [...sections];
    copy[sIdx].description = value;
    setSections(copy);
  };

  const handleSectionDelete = (sIdx: number) => {
    setSections(sections.filter((_, i) => i !== sIdx));
  };

  // =========================
  // QUESTIONS HANDLERS
  // =========================
  const handleQuestionChange = (sIdx: number, qIdx: number, updated: any) => {
    const copy = [...sections];
    copy[sIdx].questions[qIdx] = updated;
    setSections(copy);
  };

  const handleQuestionDelete = (sIdx: number, qIdx: number) => {
    const copy = [...sections];
    copy[sIdx].questions = copy[sIdx].questions.filter((_: any, i: number) => i !== qIdx);
    setSections(copy);
  };

  const handleAjouterQuestion = (sIdx: number) => {
    const copy = [...sections];
    const newQuestion = {
      id: Date.now(), // ID مؤقت
      text: "",
      type: "radio",
      is_required: true,
      options: [{ text: "Choix 1", order_index: 0 }],
    };

    if (!copy[sIdx].questions) copy[sIdx].questions = [];
    copy[sIdx].questions.push(newQuestion);
    setSections(copy);
  };

  // =========================
  // RENDER QUESTION TYPE
  // =========================
  const renderQuestion = (question: any, sIdx: number, qIdx: number) => {
    const props = {
      question,
      onChange: (u: any) => handleQuestionChange(sIdx, qIdx, u),
      onDelete: () => handleQuestionDelete(sIdx, qIdx),
    };

    switch (question.type) {
      case "text":
        return <TextQuestion {...props} />;
      case "radio":
        return <RadioQuestion {...props} />;
      case "checkbox":
        return <CheckboxQuestion {...(props as any)} />;
      case "rating":
        return <RatingQuestion {...props} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-indigo-600 font-semibold animate-pulse">Chargement de l'enquête...</div>
      </div>
    );
  }

  // =========================
  // UI DESIGN MATCHING YOUR SURVEYPRO
  // =========================
  return (
    <div className="min-h-screen bg-gray-50 pb-12 text-gray-700">
      
      {/* FIXED HEADER */}
      <div className="bg-white border-b px-8 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="text-sm font-medium text-gray-500 flex gap-6">
          <span className="text-indigo-600 border-b-2 border-indigo-600 pb-3 -mb-3 font-bold cursor-pointer">
            Contenu
          </span>
          <span className="cursor-pointer hover:text-gray-700 text-gray-400">⚙️ Paramètres</span>
          <span className="cursor-pointer hover:text-gray-700 text-gray-400">🎨 Personnalisation</span>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleEnregistrerTout}
            disabled={saving}
            className="px-5 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 transition-all"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-4xl mx-auto mt-8 space-y-6 px-4">
        
        {/* INFORMATIONS GENERALES */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 tracking-wide border-b pb-2">
            Informations générales
          </h2>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Titre de l'enquête (FR)</label>
            <input
              type="text"
              value={titreEnquete}
              onChange={(e) => setTitreEnquete(e.target.value)}
              placeholder="Ex: Feedback Produit"
              className="w-full border border-gray-200 p-2.5 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Description (FR)</label>
            <textarea
              value={descriptionEnquete}
              onChange={(e) => setDescriptionEnquete(e.target.value)}
              placeholder="Collectez des retours sur votre produit"
              className="w-full border border-gray-200 p-2.5 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              rows={3}
            />
          </div>
        </div>

        {/* SECTIONS LIST */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <h3 className="text-xl font-bold text-gray-800">Sections</h3>
            <button
              type="button"
              onClick={handleAjouterSection}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1"
            >
              <span className="text-indigo-600 font-bold text-base">+</span> Ajouter une section
            </button>
          </div>

          {sections.map((section, sIdx) => (
            <div
              key={section.id || sIdx}
              className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm relative group"
            >
              {/* HEADER SECTION DETAILS */}
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 border-b pb-2">
                <span>⣿</span> 
                <span className="text-gray-700">{section.title || `Section ${sIdx + 1}`}</span>
                <span className="font-normal text-gray-400">({section.questions?.length || 0} question(s))</span>
              </div>

              {/* SECTION FIELDS - PARALLEL DESIGN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Titre de la section (FR)</label>
                  <input 
                    type="text"
                    value={section.title}
                    onChange={(e) => handleSectionTitleChange(sIdx, e.target.value)}
                    placeholder="Ex: Utilisation du produit"
                    className="w-full border border-gray-200 p-2.5 rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Description (FR)</label>
                  <input 
                    type="text"
                    value={section.description || ""}
                    onChange={(e) => handleSectionDescriptionChange(sIdx, e.target.value)}
                    placeholder="Description de la section (Optionnelle)"
                    className="w-full border border-gray-200 p-2.5 rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* QUESTIONS LIST */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Questions</h4>
                
                {section.questions && section.questions.length > 0 ? (
                  <div className="space-y-4">
                    {section.questions.map((question: any, qIdx: number) => (
                      <div key={question.id || qIdx} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        {renderQuestion(question, sIdx, qIdx)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400">
                    Aucune question dans cette section. Cliquez sur le bouton ci-dessous pour en ajouter une.
                  </div>
                )}
              </div>

              {/* ADD QUESTION BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleAjouterQuestion(sIdx)}
                  className="w-full py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-1 shadow-sm"
                >
                  <span className="text-indigo-600 font-bold text-base">+</span> Ajouter une question
                </button>
              </div>

              {/* DELETE SECTION BUTTON */}
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleSectionDelete(sIdx)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
                >
                  Supprimer la section
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};