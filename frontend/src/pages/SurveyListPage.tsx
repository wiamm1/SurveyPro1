import { useEffect, useMemo, useState } from 'react';
import {
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  Play,
  Pause,
  FileText,
  Calendar,
  BarChart2,
  Search,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { SurveyCreateModal } from '../components/surveys/SurveyCreateModal';
import { SurveyStatusBadge } from '../components/surveys/SurveyStatusBadge';
import { usePermissions } from '../hooks/usePermissions';
import { useSurveyStore } from '../store/useSurveyStore';
import type { SurveyStatus } from '../types/survey';

const PAGE_SIZE = 10;

export const SurveyListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const surveys = useSurveyStore((state) => state.surveys);
  const isLoading = useSurveyStore((state) => state.isLoading);
  const total = useSurveyStore((state) => state.total);
  const fetchSurveys = useSurveyStore((state) => state.fetchSurveys);
  const duplicateSurvey = useSurveyStore((state) => state.duplicateSurvey);
  const deleteSurvey = useSurveyStore((state) => state.deleteSurvey);
  const toggleStatus = useSurveyStore((state) => state.toggleStatus);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchSurveys({
        page,
        pageSize: PAGE_SIZE,
        search,
        status: statusFilter || undefined,
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [fetchSurveys, page, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('survey.filters.allStatuses') },
      { value: 'draft', label: t('survey.status.draft') },
      { value: 'active', label: t('survey.status.active') },
      { value: 'inactive', label: t('survey.status.inactive') },
    ],
    [t]
  );

  const handleCreated = (surveyId: number) => {
    navigate(`/surveys/${surveyId}/edit`);
  };

  const handleDuplicate = async (surveyId: number) => {
    await duplicateSurvey(surveyId);
    await fetchSurveys({
      page,
      pageSize: PAGE_SIZE,
      search,
      status: statusFilter || undefined,
    });
  };

  const handleDelete = async (surveyId: number) => {
    if (!window.confirm(t('survey.confirm.delete'))) {
      return;
    }
    await deleteSurvey(surveyId);
    await fetchSurveys({
      page,
      pageSize: PAGE_SIZE,
      search,
      status: statusFilter || undefined,
    });
  };

  const handleToggleStatus = async (surveyId: number, status: SurveyStatus) => {
    const nextStatus: SurveyStatus =
      status === 'active' ? 'inactive' : 'active';
    await toggleStatus(surveyId, nextStatus);
    await fetchSurveys({
      page,
      pageSize: PAGE_SIZE,
      search,
      status: statusFilter || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
            {t('survey.list.kicker')}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {t('survey.list.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            {t('survey.list.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {can('surveys:create') && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
              {t('survey.list.create')}
            </button>
          )}
        </div>
      </div>

      {/* Filters section */}
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_auto] lg:items-end">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t('survey.filters.search')}
          </span>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder={t('survey.filters.searchPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t('survey.filters.status')}
          </span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() =>
            fetchSurveys({
              page,
              pageSize: PAGE_SIZE,
              search,
              status: statusFilter || undefined,
            })
          }
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {t('common.refresh')}
        </button>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {isLoading && surveys.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            {t('survey.list.loading')}
          </div>
        ) : surveys.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            {t('survey.list.empty')}
          </div>
        ) : (
          surveys.map((survey) => (
            <div
              key={survey.id}
              className="group relative flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md sm:flex-row sm:items-center"
            >
              {/* Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FileText className="h-6 w-6" />
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col justify-center">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-slate-900">
                    {survey.title}
                  </h3>
                  <SurveyStatusBadge status={survey.status} />
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                  {survey.description || t('survey.list.noDescription')}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {survey.created_at
                      ? new Date(survey.created_at).toLocaleDateString()
                      : '-'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                    {survey.sections_count} {t('survey.table.sections').toLowerCase()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                    {survey.questions_count} {t('survey.table.questions').toLowerCase()}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-4 sm:border-t-0 sm:pt-0">
                <button
                  type="button"
                  onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('survey.actions.edit')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/surveys/${survey.id}/analytics`)}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
                >
                  <BarChart2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('survey.actions.analytics', { defaultValue: 'Analytics' })}</span>
                </button>

                <div className="relative inline-block text-left">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === survey.id ? null : survey.id
                      )
                    }
                    aria-label={t('survey.table.actions')}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {openMenuId === survey.id && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                        aria-label={t('common.close')}
                      />
                      <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            navigate(`/surveys/${survey.id}/edit`);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          {t('survey.actions.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setOpenMenuId(null);
                            await handleDuplicate(survey.id);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Copy className="h-4 w-4" />
                          {t('survey.actions.duplicate')}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setOpenMenuId(null);
                            await handleToggleStatus(
                              survey.id,
                              survey.status
                            );
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {survey.status === 'active' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          {survey.status === 'active'
                            ? t('survey.actions.unpublish')
                            : t('survey.actions.publish')}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setOpenMenuId(null);
                            await handleDelete(survey.id);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('survey.actions.delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {surveys.length > 0 && (
        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-500">
            {t('survey.list.paginationInfo', {
              count: surveys.length,
              total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:bg-slate-50"
            >
              {t('common.previous')}
            </button>
            <span className="flex items-center justify-center rounded-xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:bg-slate-50"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      <SurveyCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
};

