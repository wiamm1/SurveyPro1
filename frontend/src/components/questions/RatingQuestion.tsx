// components/questions/RatingQuestion.tsx
import React from 'react';

interface RatingQuestionProps {
  question: any;
  onChange: (updatedQuestion: any) => void;
  onDelete: () => void;
}

export const RatingQuestion: React.FC<RatingQuestionProps> = ({ question, onChange, onDelete }) => {
  return (
    <div className="border border-gray-100 rounded-xl bg-gray-50/40 p-4 space-y-4 shadow-sm relative">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 font-medium mb-1">Texte de la question (FR)</label>
          <input 
            type="text"
            value={question.text}
            placeholder="Ex: Évaluez notre service..."
            onChange={(e) => onChange({ ...question, text: e.target.value })}
            className="w-full border border-gray-200 p-2 bg-white rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="w-64">
          <label className="block text-xs text-gray-500 font-medium mb-1">Type de question</label>
          <select 
            value={question.type}
            onChange={(e) => onChange({ ...question, type: e.target.value })}
            className="w-full border border-gray-200 p-2 bg-white rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="text">📝 Texte libre</option>
            <option value="radio">🔘 Choix unique</option>
            <option value="checkbox">☑️ Choix multiples</option>
            <option value="rating">⭐ Note / Rating</option>
          </select>
        </div>
      </div>

      <div className="flex gap-1 text-xl text-yellow-400 p-2 bg-white rounded-lg border border-gray-100 w-fit">
        ⭐⭐⭐⭐⭐ <span className="text-xs text-gray-400 ml-2 self-center">(Échelle de 1 à 5)</span>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
        <input 
          type="checkbox" 
          id={`req-${question.id}`} 
          checked={question.is_required} 
          onChange={(e) => onChange({ ...question, is_required: e.target.checked })}
          className="rounded border-gray-300 text-blue-600"
        />
        <label htmlFor={`req-${question.id}`} className="cursor-pointer">Obligatoire</label>
      </div>

      <button onClick={onDelete} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs">
        🗑️
      </button>
    </div>
  );
};