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

type SurveyQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
};

type SurveyState = {
  surveys: SurveyListItem[];
  currentSurvey: SurveyFull | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  fetchSurveys: (params?: SurveyQuery) => Promise<void>;
  fetchSurveyById: (surveyId: number) => Promise<void>;
  createSurvey: (payload: SurveyCreatePayload) => Promise<SurveyFull>;
  updateSurvey: (
    surveyId: number,
    payload: SurveyUpdatePayload
  ) => Promise<void>;
  duplicateSurvey: (surveyId: number) => Promise<void>;
  deleteSurvey: (surveyId: number) => Promise<void>;
  toggleStatus: (surveyId: number, status: SurveyStatus) => Promise<void>;
  setCurrentSurvey: (survey: SurveyFull | null) => void;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Une erreur inattendue est survenue.';
};

const mergeListItem = (
  items: SurveyListItem[],
  surveyId: number,
  updater: (item: SurveyListItem) => SurveyListItem
) => items.map((item) => (item.id === surveyId ? updater(item) : item));

export const useSurveyStore = create<SurveyState>((set, get) => ({
  surveys: [],
  currentSurvey: null,
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 20,

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
    set({ isLoading: true, error: null });
    try {
      const survey = await surveyApi.createSurvey(payload);
      set((state) => ({
        surveys: [
          {
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
          },
          ...state.surveys,
        ],
        currentSurvey: survey,
      }));
      toast.success('Enquête créée avec succès.');
      return survey;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSurvey: async (surveyId, payload) => {
    set({ isLoading: true, error: null });
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
            ? {
                ...state.currentSurvey,
                title: survey.title,
                description: survey.description,
                status: survey.status,
                updated_at: survey.updated_at,
              }
            : state.currentSurvey,
      }));
      toast.success('Enquête mise à jour.');
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  duplicateSurvey: async (surveyId) => {
    set({ isLoading: true, error: null });
    try {
      const survey = await surveyApi.duplicateSurvey(surveyId);
      set((state) => ({
        surveys: [
          {
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
          },
          ...state.surveys,
        ],
        currentSurvey: survey,
      }));
      toast.success('Enquête dupliquée.');
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
        surveys: state.surveys.filter((survey) => survey.id !== surveyId),
        currentSurvey:
          state.currentSurvey?.id === surveyId ? null : state.currentSurvey,
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
    set({ isLoading: true, error: null });
    try {
      const survey = await surveyApi.toggleStatus(surveyId, { status });
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
      toast.success(
        status === 'active' ? 'Enquête publiée.' : 'Enquête dépubliée.'
      );
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentSurvey: (survey) => {
    set({ currentSurvey: survey });
  },
}));
