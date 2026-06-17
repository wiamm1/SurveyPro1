import { useEffect, useRef, type ReactNode } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { SurveySection } from '../../types/survey';

type SectionEditorProps = {
  id: string;
  section: SurveySection;
  onTitleChange: (title: string) => void;
  onAddQuestion: () => void;
  onDelete: () => void;
  children: ReactNode;
};

export const SectionEditor = ({
  id,
  section,
  onTitleChange,
  onAddQuestion,
  onDelete,
  children,
}: SectionEditorProps) => {
  const { t } = useTranslation();
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
  }, [transform, transition, isDragging]);

  return (
    <section
      ref={(node) => {
        containerRef.current = node;
        setNodeRef(node);
      }}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
            aria-label={t('survey.editor.dragSection')}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              {t('survey.editor.sectionLabel')}
            </p>
            <input
              value={section.title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder={t('survey.editor.sectionPlaceholder')}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
          {t('common.delete')}
        </button>
      </div>

      <div className="space-y-4">{children}</div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onAddQuestion}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          {t('survey.editor.addQuestion')}
        </button>
      </div>
    </section>
  );
};
