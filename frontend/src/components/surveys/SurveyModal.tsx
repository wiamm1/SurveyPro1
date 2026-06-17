// frontend/src/components/surveys/SurveyModal.tsx
import React, { useState } from 'react';
import { surveyService } from '../../services/surveyService';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newSurveyId: string | number) => void; // مصفوفة تدعم النص والرقم لمنع الأخطاء
}

export const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return; // ✅ تعديل دالة trim لمنع الفراغات والأخطاء

    try {
      setLoading(false);
      setLoading(true);
      
      // 1. استدعاء السيرفيس لإنشاء الاستبيان في الباكند
      const data = await surveyService.createSurvey(title, description);
      
      // 2. التحقق من وجود الـ id وتمريره للدالة الأب
      if (data && (data.id !== undefined && data.id !== null)) {
        onCreate(data.id); 
        onClose();
        // إعادة تهيئة الحقول بعد النجاح
        setTitle('');
        setDescription('');
      } else {
        alert("Impossible de récupérer l'ID de l'enquête.");
      }
    } catch (error) {
      console.error("Erreur de création:", error);
      alert("Impossible de créer l'enquête.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <form onSubmit={handleCreateSubmit} className="bg-white p-6 rounded-xl max-w-md w-full space-y-4 shadow-xl">
        <h2 className="text-lg font-bold text-gray-800">Créer une nouvelle enquête</h2>
        
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Titre de l'enquête *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded-lg text-sm outline-none focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Description (Optionnelle)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2 rounded-lg text-sm outline-none focus:border-indigo-500"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-xs font-bold hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Création...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
};