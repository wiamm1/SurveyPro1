import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { surveyApi } from '../../services/surveyApi';
import { useSurveyStore } from '../../store/useSurveyStore';
import { surveyFormSchema } from '../../validations/surveySchemas';

import type { z } from 'zod';

type SurveyCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (surveyId: number) => void;
};

type SurveyFormValues = z.infer<typeof surveyFormSchema>;

type TemplateOption = {
  id: number;
  title: string;
  description?: string | null;
};

export const SurveyCreateModal = ({
  isOpen,
  onClose,
  onCreated,
}: SurveyCreateModalProps) => {
  const { t } = useTranslation();
  const createSurvey = useSurveyStore((state) => state.createSurvey);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SurveyFormValues>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      title: '',
      description: '',
      templateId: undefined,
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadTemplates = async () => {
      try {
        setTemplatesLoading(true);
        const data = await surveyApi.listTemplates();
        setTemplates(
          data.map((template) => ({
            id: template.id,
            title: template.title,
            description: template.description,
          }))
        );
      } catch {
        setTemplates([]);
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) {
    return null;
  }

  const onSubmit = async (values: SurveyFormValues) => {
    try {
      const survey = await createSurvey({
        title: values.title,
        description: values.description || null,
        template_id: values.templateId,
      });
      toast.success(t('survey.messages.created'));
      onCreated(survey.id);
      reset();
      onClose();
    } catch {
      toast.error(t('survey.messages.createFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t('survey.create.title')}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t('survey.create.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
          >
            {t('common.close')}
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {t('survey.form.title')}
            </label>
            <input
              {...register('title')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
              placeholder={t('survey.form.titlePlaceholder')}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {t('survey.form.description')}
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
              placeholder={t('survey.form.descriptionPlaceholder')}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {t('survey.form.template')}
            </label>
            <select
              {...register('templateId')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
              defaultValue=""
            >
              <option value="">
                {templatesLoading
                  ? t('survey.form.loadingTemplates')
                  : t('survey.form.emptyTemplate')}
              </option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? t('survey.create.creating')
                : t('survey.create.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
