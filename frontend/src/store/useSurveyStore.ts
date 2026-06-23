import { create } from 'zustand';
import { toast } from 'sonner';

import { surveyApi, type SurveyListResponse } from '../services/surveyApi';
import type {
  SurveyCreatePayload,
  SurveyFull,
  SurveyListItem,
  SurveyStatus,
  SurveyUpdatePayload,
} from '../types/survey';

// ─── Types ────────────────────────────────────────────────────────────────────

type SurveyQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
};

type SurveyState = {
  /** The paginated list displayed on SurveyListPage */
  surveys: SurveyListItem[];
  /** The fully loaded survey used by SurveyEditorPage */
  currentSurvey: SurveyFull | null;
  /** Global loading flag (list fetches, status toggles, deletes) */
  isLoading: boolean;
  /** Separate saving flag for the editor so it doesn't block the whole page */
  isSaving: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;

  // ─── Actions ───────────────────────────────────────────────────────────
  fetchSurveys: (params?: SurveyQuery) => Promise<void>;
  fetchSurveyById: (surveyId: number) => Promise<void>;
  createSurvey: (payload: SurveyCreatePayload) => Promise<SurveyFull>;
  updateSurvey: (surveyId: number, payload: SurveyUpdatePayload) => Promise<void>;
  /** Full replace: wipes existing sections and recreates from payload */
  saveFullSurvey: (surveyId: number, payload: SurveyCreatePayload) => Promise<SurveyFull>;
  duplicateSurvey: (surveyId: number) => Promise<void>;
  deleteSurvey: (surveyId: number) => Promise<void>;
  toggleStatus: (surveyId: number, status: SurveyStatus) => Promise<void>;
  setCurrentSurvey: (survey: SurveyFull | null) => void;
  clearError: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  // Try to extract FastAPI validation / HTTP detail
  const detail = (error as { response?: { data?: { detail?: string } } })
    ?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  return 'Une erreur inattendue est survenue.';
};

/** Immutably patch a single item in the surveys list by id */
const mergeListItem = (
  items: SurveyListItem[],
  surveyId: number,
  updater: (item: SurveyListItem) => SurveyListItem
) => items.map((item) => (item.id === surveyId ? updater(item) : item));

/** Convert a SurveyFull response to a SurveyListItem */
const toListItem = (survey: SurveyFull): SurveyListItem => ({
  id: survey.id,
  title: survey.title,
  description: survey.description,
  status: survey.status,
  company_id: survey.company_id,
  created_by: survey.created_by,
  template_id: survey.template_id,
  created_at: survey.created_at,
  updated_at: survey.updated_at,
  sections_count: survey.sections_count,
  questions_count: survey.questions_count,
});

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSurveyStore = create<SurveyState>((set, get) => ({
  surveys: [],
  currentSurvey: null,
  isLoading: false,
  isSaving: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 20,

  clearError: () => set({ error: null }),

  fetchSurveys: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response: SurveyListResponse = await surveyApi.listSurveys({
        page: params?.page,
        pageSize: params?.pageSize,
        search: params?.search,
        status: params?.status,
      });
      set({
        surveys: response.items,
        total: response.total,
        page: response.page,
        pageSize: response.page_size,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      toast.error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSurveyById: async (surveyId) => {
    set({ isLoading: true, error: null });
    try {
      const survey = await surveyApi.getSurvey(surveyId);
      set({ currentSurvey: survey });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      toast.error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  createSurvey: async (payload) => {
    set({ isSaving: true, error: null });
    try {
      const survey = await surveyApi.createSurvey(payload);
      set((state) => ({
        surveys: [toListItem(survey), ...state.surveys],
        currentSurvey: survey,
        total: state.total + 1,
      }));
      toast.success('Enquête créée avec succès.');
      return survey;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  updateSurvey: async (surveyId, payload) => {
    set({ isSaving: true, error: null });
    try {
      const survey = await surveyApi.updateSurvey(surveyId, payload);
      set((state) => ({
        surveys: mergeListItem(state.surveys, surveyId, (item) => ({
          ...item,
          title: survey.title,
          description: survey.description,
          status: survey.status,
          updated_at: survey.updated_at,
        })),
        currentSurvey:
          state.currentSurvey?.id === surveyId
            ? { ...state.currentSurvey, title: survey.title, description: survey.description }
            : state.currentSurvey,
      }));
      toast.success('Enquête mise à jour.');
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  saveFullSurvey: async (surveyId, payload) => {
    set({ isSaving: true, error: null });
    try {
      const survey = await surveyApi.saveFullSurvey(surveyId, payload);
      // Update both the full survey in editor AND the list card
      set((state) => ({
        currentSurvey: survey,
        surveys: mergeListItem(state.surveys, surveyId, () => toListItem(survey)),
      }));
      toast.success('Enquête enregistrée.');
      return survey;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  duplicateSurvey: async (surveyId) => {
    set({ isLoading: true, error: null });
    try {
      const survey = await surveyApi.duplicateSurvey(surveyId);
      set((state) => ({
        surveys: [toListItem(survey), ...state.surveys],
        total: state.total + 1,
      }));
      toast.success('Enquête dupliquée avec succès.');
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSurvey: async (surveyId) => {
    set({ isLoading: true, error: null });
    try {
      await surveyApi.deleteSurvey(surveyId);
      set((state) => ({
        surveys: state.surveys.filter((s) => s.id !== surveyId),
        currentSurvey: state.currentSurvey?.id === surveyId ? null : state.currentSurvey,
        total: Math.max(0, state.total - 1),
      }));
      toast.success('Enquête supprimée.');
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  toggleStatus: async (surveyId, status) => {
    // Optimistic update — revert on failure
    const prevSurveys = get().surveys;
    const prevCurrent = get().currentSurvey;
    set((state) => ({
      surveys: mergeListItem(state.surveys, surveyId, (item) => ({
        ...item,
        status,
      })),
      currentSurvey:
        state.currentSurvey?.id === surveyId
          ? { ...state.currentSurvey, status }
          : state.currentSurvey,
    }));
    try {
      const survey = await surveyApi.toggleStatus(surveyId, { status });
      // Confirm with server values
      set((state) => ({
        surveys: mergeListItem(state.surveys, surveyId, (item) => ({
          ...item,
          status: survey.status,
          updated_at: survey.updated_at,
        })),
        currentSurvey:
          state.currentSurvey?.id === surveyId
            ? {
                ...state.currentSurvey,
                status: survey.status,
                sections: survey.sections,
                updated_at: survey.updated_at,
              }
            : state.currentSurvey,
      }));
      toast.success(status === 'active' ? 'Enquête publiée.' : 'Enquête dépubliée.');
    } catch (error) {
      // Revert optimistic update
      set({ surveys: prevSurveys, currentSurvey: prevCurrent });
      const message = getErrorMessage(error);
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  setCurrentSurvey: (survey) => {
    set({ currentSurvey: survey });
  },
}));
