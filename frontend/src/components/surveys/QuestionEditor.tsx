import { useEffect, useRef, useState } from 'react';
import { Check, GripVertical, Plus, Trash2, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { SurveyQuestion } from '../../types/survey';
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
  const [logicExpanded, setLogicExpanded] = useState(false);

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
      className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4"
    >
      {/* Top Row: Drag Handle, Question Text, Type Selector, Delete */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 self-start sm:self-center"
          aria-label={t('survey.editor.dragQuestion')}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 w-full">
          <input
            value={question.text}
            onChange={(event) => updateField('text', event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            placeholder={t('survey.editor.questionTextPlaceholder', { defaultValue: 'Texte de la question (FR)' })}
          />
        </div>

        <div className="shrink-0 w-full sm:w-auto">
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
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
          aria-label={t('common.delete')}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Second Row: Checkbox */}
      <div className="mt-3 ml-2 sm:ml-12">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={question.is_required}
            onChange={(event) =>
              updateField('is_required', event.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-slate-700">{t('survey.editor.required', { defaultValue: 'Obligatoire' })}</span>
        </label>
      </div>

      {/* Dynamic Content Block */}
      <div className="mt-4 ml-2 sm:ml-12 border-t border-slate-100 pt-4">
        {isChoiceQuestion && (
          <div className="space-y-3">
            <div className="space-y-2">
              {question.options.map((option, index) => (
                <div
                  key={`${index}-${option.order_index}`}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300">
                    {question.type === 'checkbox' && <Check className="h-3 w-3 text-transparent" />}
                  </span>
                  <input
                    value={option.text}
                    onChange={(event) =>
                      updateOption(index, event.target.value)
                    }
                    className="flex-1 rounded-xl border border-transparent hover:border-slate-200 focus:border-indigo-500 bg-transparent hover:bg-slate-50 focus:bg-white px-3 py-2 text-sm outline-none transition"
                    placeholder={t('survey.editor.optionPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="rounded-xl p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    aria-label={t('common.remove')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition"
            >
              <Plus className="h-4 w-4" />
              {t('survey.editor.addOption', { defaultValue: 'Ajouter un choix' })}
            </button>
          </div>
        )}

        {isScaleQuestion && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">
                {t('survey.editor.scaleMin', { defaultValue: 'Min' })}
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
                className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">
                {t('survey.editor.scaleMax', { defaultValue: 'Max' })}
              </span>
              <input
                type="number"
                value={
                  typeof question.settings?.max === 'number'
                    ? question.settings.max
                    : 5
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
                className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </label>
          </div>
        )}

        {isMatrixQuestion && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <Settings className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-600">
              {t('survey.editor.matrixPlaceholder', { defaultValue: 'Configuration de grille (Lignes / Colonnes) à venir' })}
            </p>
          </div>
        )}

        {(question.type === 'text_short' || question.type === 'text_long') && (
           <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
             <p className="text-sm text-slate-400 italic">
               {t('survey.editor.textPlaceholder', { defaultValue: 'L\'utilisateur saisira du texte ici.' })}
             </p>
           </div>
        )}

        {question.type === 'date' && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
            <p className="text-sm text-slate-400 italic">
              {t('survey.editor.datePlaceholder', { defaultValue: 'L\'utilisateur sélectionnera une date.' })}
            </p>
          </div>
        )}
      </div>

      {/* Accordion Logique Conditionnelle */}
      <div className="mt-4 ml-2 sm:ml-12 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setLogicExpanded(!logicExpanded)}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
        >
          {logicExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {t('survey.editor.conditionalLogic', { defaultValue: 'Logique conditionnelle' })}
        </button>
        
        {logicExpanded && (
          <div className="mt-3 rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 text-sm text-indigo-800">
            <p>{t('survey.editor.logicPlaceholder', { defaultValue: 'Fonctionnalité avancée de logique conditionnelle à implémenter. Permet de définir des règles comme "Si réponse = X, aller à question Y".' })}</p>
          </div>
        )}
      </div>
    </article>
  );
};
