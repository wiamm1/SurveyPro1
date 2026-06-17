import { useTranslation } from 'react-i18next';

import type { QuestionType } from '../../types/survey';
import { QuestionTypeIcon } from './QuestionTypeIcon';

type QuestionTypeSelectorProps = {
  value: QuestionType;
  onChange: (value: QuestionType) => void;
  className?: string;
};

const questionTypes: QuestionType[] = [
  'radio',
  'checkbox',
  'text_short',
  'text_long',
  'scale',
  'matrix',
  'date',
];

export const QuestionTypeSelector = ({
  value,
  onChange,
  className = '',
}: QuestionTypeSelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {t('survey.editor.questionType')}
      </label>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {questionTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={[
              'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors',
              value === type
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            ].join(' ')}
          >
            <QuestionTypeIcon type={type} className="text-current" />
            <span>{t(`survey.questionTypes.${type}`)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
