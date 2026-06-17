// frontend/src/services/surveyService.ts

import axios from "axios";

const API_URL = "http://localhost:8000/api/surveys";

// Fonction centralisée pour récupérer les configurations de requêtes (Token & JSON)
const getHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const surveyService = {
  // 1. Créer une enquête (Informations Générales de base)
  createSurvey: async (
    title: string,
    description: string,
    status: string = "draft"
  ) => {
    const response = await axios.post(
      API_URL,
      {
        title,
        description,
        status,
      },
      {
        headers: getHeaders(),
      }
    );

    return response.data; // Retourne l'enquête créée avec son ID du backend
  },

  // 2. Récupérer les informations de l'enquête par son ID
  getSurveyById: async (surveyId: string | number) => {
    const response = await axios.get(`${API_URL}/${surveyId}`, {
      headers: getHeaders(),
    });

    return response.data;
  },

  // 3. Récupérer la structure complète (Sections et Questions) de l'enquête
  getSurveyStructure: async (surveyId: string | number) => {
    const response = await axios.get(
      `${API_URL}/${surveyId}/structure`,
      {
        headers: getHeaders(),
      }
    );

    return response.data;
  },

  // 4. Sauvegarder la structure complète de l'enquête (Sections, Questions et Options)
  saveSurveyStructure: async (surveyId: string | number, payload: any) => {
    const response = await axios.put(
      `${API_URL}/${surveyId}/save`,
      payload,
      {
        headers: getHeaders(),
      }
    );

    return response.data; // Retourne la structure mise à jour avec les vrais IDs de la BD
  },

  // 5. Créer une Section individuellement (si besoin hors sauvegarde globale)
  createSection: async (
    surveyId: string | number,
    title: string,
    orderIndex: number
  ) => {
    const response = await axios.post(
      `${API_URL}/${surveyId}/sections`,
      {
        title,
        order_index: orderIndex,
      },
      {
        headers: getHeaders(),
      }
    );

    return response.data;
  },

  // 6. Créer une Question individuellement (si besoin hors sauvegarde globale)
  createQuestion: async (
    sectionId: number,
    questionData: {
      text: string;
      type: string;
      is_required: boolean;
      order_index: number;
      options: {
        text: string;
        order_index: number;
      }[];
    }
  ) => {
    const response = await axios.post(
      `${API_URL}/sections/${sectionId}/questions`,
      questionData,
      {
        headers: getHeaders(),
      }
    );

    return response.data;
  },
};