import { useEffect, useRef, useState, type ReactNode } from 'react';
import { GripVertical, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { SurveySection } from '../../types/survey';

type SectionEditorProps = {
  id: string;
  section: SurveySection;
  onTitleChange: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
  onAddQuestion: () => void;
  onDelete: () => void;
  children: ReactNode;
};

export const SectionEditor = ({
  id,
  section,
  onTitleChange,
  onDescriptionChange,
  onAddQuestion,
  onDelete,
  children,
}: SectionEditorProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    node.style.transform = CSS.Transform.toString(transform) ?? '';
    node.style.transition = transition ?? '';
    node.style.opacity = isDragging ? '0.7' : '1';
    node.style.zIndex = isDragging ? '10' : '1';
  }, [transform, transition, isDragging]);

  const questionCount = section.questions?.length || 0;

  return (
    <section
      ref={(node) => {
        containerRef.current = node;
        setNodeRef(node);
      }}
      className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
    >
      {/* Header (Always visible) */}
      <div className="flex items-center justify-between bg-slate-50 p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            aria-label={t('survey.editor.dragSection')}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          <h3 className="font-semibold text-slate-900">
            {section.title || t('survey.editor.sectionPlaceholder')} <span className="text-slate-500 font-normal">({questionCount} question{questionCount !== 1 ? 's' : ''})</span>
          </h3>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-5">
          <div className="space-y-4 mb-6">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t('survey.editor.sectionLabel', { defaultValue: 'Titre de la section (FR)' })}
              </label>
              <input
                value={section.title}
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder={t('survey.editor.sectionPlaceholder')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </div>

            {onDescriptionChange && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {t('survey.form.description', { defaultValue: 'Description (FR)' })}
                </label>
                <textarea
                  value={section.description || ''}
                  onChange={(event) => onDescriptionChange(event.target.value)}
                  placeholder={t('survey.form.descriptionPlaceholder', { defaultValue: 'Optionnel' })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Questions Block */}
          <div className="space-y-4 rounded-2xl bg-slate-50/50 p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-700">Questions</h4>
              <button
                type="button"
                onClick={onAddQuestion}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                {t('survey.editor.addQuestion')}
              </button>
            </div>
            
            <div className="space-y-4">{children}</div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
            >
              <Trash2 className="h-4 w-4" />
              {t('common.delete', { defaultValue: 'Supprimer la section' })}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
