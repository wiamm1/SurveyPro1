import React, { useState } from 'react';
import { Edit3, BarChart2, MoreVertical, FileText, Calendar, Copy, Trash2 } from 'lucide-react';

interface SurveyCardProps {
  id: string | number; // 👈 عدلي هذا السطر ليصبح هكذا بدلاً من string فقط
  title: string;
  description?: string;
  status: string;
  date: string;
  sectionsCount: number;
  questionsCount: number;
  onEdit: () => void;
  onAnalytics: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}
export const SurveyCard: React.FC<SurveyCardProps> = ({
  title, description, status, date, sectionsCount, questionsCount,
  onEdit, onAnalytics, onDuplicate, onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 relative">
      
      {/* المعلومات الأساسية */}
      <div className="flex items-start gap-4 flex-1">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hidden sm:block">
          <FileText size={24} />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-800 text-base md:text-lg">{title}</h3>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              {status}
            </span>
          </div>
          <p className="text-sm text-gray-500 line-clamp-1">{description || "Aucune description"}</p>
          
          {/* الرموز والإحصائيات السفلى */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1">
              <Calendar size={14} /> {date}
            </span>
            <span>•</span>
            <span>{sectionsCount} section(s)</span>
            <span>•</span>
            <span>{questionsCount} question(s)</span>
          </div>
        </div>
      </div>

      {/* الأزرار والعمليات المتاحة */}
      <div className="flex items-center gap-2 self-end md:self-center relative">
        <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <Edit3 size={16} /> Modifier
        </button>
        <button onClick={onAnalytics} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <BarChart2 size={16} /> Analytics
        </button>
        
        {/* قائمة الخيارات الثلاث نقاط المستوحاة من التصميم */}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
            <MoreVertical size={18} />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-20 text-sm">
                <button onClick={() => { onDuplicate(); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Copy size={16} /> Dupliquer
                </button>
                <hr className="border-gray-100" />
                <button onClick={() => { onDelete(); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <Trash2 size={16} /> Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};