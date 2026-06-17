import axios from 'axios';

export type UserListItem = {
  id: number;
  name: string | null;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  company_id: number | null;
  is_active: boolean;
  permissions: string[];
};

export type InviteUserPayload = {
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
};

export type UpdateRolePayload = {
  role: 'admin' | 'analyst' | 'viewer';
};

export type UpdateStatusPayload = {
  is_active: boolean;
};

const API_URL = 'http://127.0.0.1:8000/users';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
  'Content-Type': 'application/json',
});

export const userService = {
  listUsers: async () => {
    const response = await axios.get<UserListItem[]>(API_URL, {
      headers: authHeaders(),
    });
    return response.data;
  },
  inviteUser: async (payload: InviteUserPayload) => {
    const response = await axios.post(API_URL + '/invite', payload, {
      headers: authHeaders(),
    });
    return response.data;
  },
  updateUserRole: async (userId: number, role: UpdateRolePayload) => {
    const response = await axios.patch(`${API_URL}/${userId}/role`, role, {
      headers: authHeaders(),
    });
    return response.data;
  },
  updateUserStatus: async (userId: number, payload: UpdateStatusPayload) => {
    const response = await axios.patch(`${API_URL}/${userId}/status`, payload, {
      headers: authHeaders(),
    });
    return response.data;
  },
  deleteUser: async (userId: number) => {
    const response = await axios.delete(`${API_URL}/${userId}`, {
      headers: authHeaders(),
    });
    return response.data;
  },
};
