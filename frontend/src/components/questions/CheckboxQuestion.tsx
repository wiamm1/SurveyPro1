// components/questions/CheckboxQuestion.tsx
import React from 'react';

interface CheckboxQuestionProps {
  question: any;
  onChange: (updatedQuestion: any) => void;
  onDelete: () => void;
}

export const CheckboxQuestion: React.FC<CheckboxQuestionProps> = ({ question, onChange, onDelete }) => {
  
  // دالة إضافة خيار جديد (Checkbox)
  const handleAddOption = () => {
    const currentOptions = question.options || [];
    const newOption = { text: `Option ${currentOptions.length + 1}`, order_index: currentOptions.length };
    onChange({ ...question, options: [...currentOptions, newOption] });
  };

  // دالة تعديل نص الخيار
  const handleOptionTextChange = (index: number, val: string) => {
    const updatedOptions = [...question.options];
    updatedOptions[index].text = val;
    onChange({ ...question, options: updatedOptions });
  };

  // دالة حذف خيار
  const handleRemoveOption = (index: number) => {
    const updatedOptions = question.options.filter((_: any, i: number) => i !== index);
    onChange({ ...question, options: updatedOptions });
  };

  return (
    <div className="border border-gray-100 rounded-xl bg-gray-50/40 p-4 space-y-4 shadow-sm relative">
      
      {/* سطر النص ونوع السؤال */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 font-medium mb-1">Texte de la question (FR)</label>
          <input 
            type="text"
            value={question.text || ''}
            placeholder="Ex: Choisissez vos compétences..."
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

      {/* إدارة خيارات الـ Checkbox ديناميكياً */}
      <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-100">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-gray-600">Options (Multiples)</span>
          <button type="button" onClick={handleAddOption} className="text-xs text-blue-600 font-bold hover:underline">+ Ajouter une option</button>
        </div>
        
        {question.options?.map((opt: any, idx: number) => (
          <div key={idx} className="flex gap-2 items-center">
            <input type="checkbox" disabled className="rounded text-indigo-600" />
            <input 
              type="text" 
              value={opt.text} 
              onChange={(e) => handleOptionTextChange(idx, e.target.value)} 
              className="flex-1 border-b p-1 text-xs outline-none focus:border-blue-500" 
            />
            <button type="button" onClick={() => handleRemoveOption(idx)} className="text-xs text-gray-400 hover:text-red-500">✕</button>
          </div>
        ))}
      </div>

      {/* خيار الإلزامية */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
        <input 
          type="checkbox" 
          id={`req-${question.id}`} 
          checked={question.is_required || false} 
          onChange={(e) => onChange({ ...question, is_required: e.target.checked })}
          className="rounded border-gray-300 text-blue-600"
        />
        <label htmlFor={`req-${question.id}`} className="cursor-pointer">Obligatoire</label>
      </div>

      {/* زر حذف السؤال كاملاً */}
      <button type="button" onClick={onDelete} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs">
        🗑️
      </button>
    </div>
  );
};