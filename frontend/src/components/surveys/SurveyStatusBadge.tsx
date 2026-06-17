import { useTranslation } from 'react-i18next';

import type { SurveyStatus } from '../../types/survey';

type SurveyStatusBadgeProps = {
  status: SurveyStatus;
};

const statusClasses: Record<SurveyStatus, string> = {
  draft: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
};

export const SurveyStatusBadge = ({ status }: SurveyStatusBadgeProps) => {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {t(`survey.status.${status}`)}
    </span>
  );
};
