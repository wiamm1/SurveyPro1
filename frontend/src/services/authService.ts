import axios from 'axios';

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: {
    email: string;
    role: string;
    company_id?: number | null;
  };
};

export type CurrentUserResponse = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  company_id: number | null;
  is_active: boolean;
  permissions: string[];
};

const API_URL = 'http://127.0.0.1:8000';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
      email,
      password,
    });
    return response.data;
  },
  signup: async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/auth/signup`, {
      email,
      password,
    });
    return response.data;
  },
  getMe: async (token: string) => {
    const response = await axios.get<CurrentUserResponse>(
      `${API_URL}/users/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};
