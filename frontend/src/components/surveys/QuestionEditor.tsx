import { useEffect, useRef } from 'react';
import { Check, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { SurveyQuestion } from '../../types/survey';
import { QuestionTypeIcon } from './QuestionTypeIcon';
import { QuestionTypeSelector } from './QuestionTypeSelector';

type QuestionEditorProps = {
  id: string;
  question: SurveyQuestion;
  onChange: (question: SurveyQuestion) => void;
  onDelete: () => void;
};

const emptyOption = { text: '', order_index: 0 };

export const QuestionEditor = ({
  id,
  question,
  onChange,
  onDelete,
}: QuestionEditorProps) => {
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

  const updateField = <K extends keyof SurveyQuestion>(
    field: K,
    value: SurveyQuestion[K]
  ) => {
    onChange({ ...question, [field]: value });
  };

  const updateOption = (index: number, text: string) => {
    const options = question.options.map((option, optionIndex) =>
      optionIndex === index ? { ...option, text } : option
    );
    onChange({ ...question, options });
  };

  const addOption = () => {
    onChange({
      ...question,
      options: [
        ...question.options,
        { ...emptyOption, order_index: question.options.length },
      ],
    });
  };

  const removeOption = (index: number) => {
    const options = question.options
      .filter((_, optionIndex) => optionIndex !== index)
      .map((option, optionIndex) => ({ ...option, order_index: optionIndex }));
    onChange({ ...question, options });
  };

  const isChoiceQuestion =
    question.type === 'radio' || question.type === 'checkbox';
  const isScaleQuestion = question.type === 'scale';
  const isMatrixQuestion = question.type === 'matrix';

  return (
    <article
      ref={(node) => {
        containerRef.current = node;
        setNodeRef(node);
      }}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
            aria-label={t('survey.editor.dragQuestion')}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <QuestionTypeIcon type={question.type} />
            <span>{t('survey.editor.questionLabel')}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
          {t('common.delete')}
        </button>
      </div>

      <div className="space-y-4 rounded-2xl bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t('survey.editor.questionText')}
          </label>
          <input
            value={question.text}
            onChange={(event) => updateField('text', event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
            placeholder={t('survey.editor.questionTextPlaceholder')}
          />
        </div>

        <QuestionTypeSelector
          value={question.type}
          onChange={(value) => {
            const nextOptions =
              value === 'radio' || value === 'checkbox'
                ? question.options.length > 0
                  ? question.options
                  : [
                      {
                        text: t('survey.editor.defaultOption'),
                        order_index: 0,
                      },
                      {
                        text: t('survey.editor.defaultOption2'),
                        order_index: 1,
                      },
                    ]
                : [];
            onChange({
              ...question,
              type: value,
              options: nextOptions,
            });
          }}
        />

        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={question.is_required}
            onChange={(event) =>
              updateField('is_required', event.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          {t('survey.editor.required')}
        </label>

        {isChoiceQuestion && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t('survey.editor.options')}
              </p>
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('survey.editor.addOption')}
              </button>
            </div>
            <div className="space-y-2">
              {question.options.map((option, index) => (
                <div
                  key={`${index}-${option.order_index}`}
                  className="flex items-center gap-2"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Check className="h-4 w-4" />
                  </span>
                  <input
                    value={option.text}
                    onChange={(event) =>
                      updateOption(index, event.target.value)
                    }
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                    placeholder={t('survey.editor.optionPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    {t('common.remove')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isScaleQuestion && (
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t('survey.editor.scaleMin')}
              </span>
              <input
                type="number"
                value={
                  typeof question.settings?.min === 'number'
                    ? question.settings.min
                    : 1
                }
                onChange={(event) =>
                  onChange({
                    ...question,
                    settings: {
                      ...(question.settings ?? {}),
                      min: Number(event.target.value),
                    },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t('survey.editor.scaleMax')}
              </span>
              <input
                type="number"
                value={
                  typeof question.settings?.max === 'number'
                    ? question.settings.max
                    : 10
                }
                onChange={(event) =>
                  onChange({
                    ...question,
                    settings: {
                      ...(question.settings ?? {}),
                      max: Number(event.target.value),
                    },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t('survey.editor.scaleLabel')}
              </span>
              <input
                value={
                  typeof question.settings?.label === 'string'
                    ? question.settings.label
                    : ''
                }
                onChange={(event) =>
                  onChange({
                    ...question,
                    settings: {
                      ...(question.settings ?? {}),
                      label: event.target.value,
                    },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
              />
            </label>
          </div>
        )}

        {isMatrixQuestion && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            {t('survey.editor.matrixPlaceholder')}
          </div>
        )}

        {question.type === 'date' && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            {t('survey.editor.datePlaceholder')}
          </div>
        )}
      </div>
    </article>
  );
};
