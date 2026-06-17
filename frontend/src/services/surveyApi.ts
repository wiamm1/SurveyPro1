import axios from 'axios';

import type {
  QuestionCreatePayload,
  QuestionOptionPayload,
  QuestionUpdatePayload,
  SectionCreatePayload,
  SectionUpdatePayload,
  SurveyCreatePayload,
  SurveyFull,
  SurveyListItem,
  SurveyStatusPayload,
  SurveyTemplatesResponse,
  SurveyUpdatePayload,
} from '../types/survey';

const API_BASE_URL = 'http://localhost:8000/api/surveys';

const createClient = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
};

export type SurveyListResponse = {
  items: SurveyListItem[];
  total: number;
  page: number;
  page_size: number;
};

export const surveyApi = {
  listSurveys: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }) => {
    const client = createClient();
    const response = await client.get<SurveyListResponse>('', {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 20,
        search: params.search || undefined,
        status: params.status || undefined,
      },
    });
    return response.data;
  },

  getSurvey: async (surveyId: number) => {
    const client = createClient();
    const response = await client.get<SurveyFull>(`/${surveyId}`);
    return response.data;
  },

  createSurvey: async (payload: SurveyCreatePayload) => {
    const client = createClient();
    const response = await client.post<SurveyFull>('', payload);
    return response.data;
  },

  updateSurvey: async (surveyId: number, payload: SurveyUpdatePayload) => {
    const client = createClient();
    const response = await client.put<SurveyListItem>(`/${surveyId}`, payload);
    return response.data;
  },

  saveFullSurvey: async (surveyId: number, payload: SurveyCreatePayload) => {
    const client = createClient();
    const response = await client.put<SurveyFull>(`/${surveyId}/full`, payload);
    return response.data;
  },

  toggleStatus: async (surveyId: number, payload: SurveyStatusPayload) => {
    const client = createClient();
    const response = await client.patch<SurveyFull>(
      `/${surveyId}/status`,
      payload
    );
    return response.data;
  },

  duplicateSurvey: async (surveyId: number) => {
    const client = createClient();
    const response = await client.post<SurveyFull>(`/${surveyId}/duplicate`);
    return response.data;
  },

  deleteSurvey: async (surveyId: number) => {
    const client = createClient();
    await client.delete(`/${surveyId}`);
  },

  listTemplates: async () => {
    const client = createClient();
    const response = await client.get<SurveyTemplatesResponse[]>('/templates');
    return response.data;
  },

  addSection: async (surveyId: number, payload: SectionCreatePayload) => {
    const client = createClient();
    const response = await client.post<SurveyFull['sections'][number]>(
      `/${surveyId}/sections`,
      payload
    );
    return response.data;
  },

  updateSection: async (sectionId: number, payload: SectionUpdatePayload) => {
    const client = createClient();
    const response = await client.put<SurveyFull['sections'][number]>(
      `/sections/${sectionId}`,
      payload
    );
    return response.data;
  },

  deleteSection: async (sectionId: number) => {
    const client = createClient();
    await client.delete(`/sections/${sectionId}`);
  },

  addQuestion: async (sectionId: number, payload: QuestionCreatePayload) => {
    const client = createClient();
    const response = await client.post<
      SurveyFull['sections'][number]['questions'][number]
    >(`/sections/${sectionId}/questions`, payload);
    return response.data;
  },

  updateQuestion: async (
    questionId: number,
    payload: QuestionUpdatePayload
  ) => {
    const client = createClient();
    const response = await client.put<
      SurveyFull['sections'][number]['questions'][number]
    >(`/questions/${questionId}`, payload);
    return response.data;
  },

  deleteQuestion: async (questionId: number) => {
    const client = createClient();
    await client.delete(`/questions/${questionId}`);
  },

  replaceQuestionOptions: async (
    questionId: number,
    payload: QuestionOptionPayload[]
  ) => {
    const client = createClient();
    const response = await client.put<
      SurveyFull['sections'][number]['questions'][number]
    >(`/questions/${questionId}/options`, payload);
    return response.data;
  },
};
