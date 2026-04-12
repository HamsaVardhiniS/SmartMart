import api from './axios';

const BASE = 'http://localhost:4001';

export const loginUser = (data) => api.post(`${BASE}/admin/login`, data);
export const getSessionProfile = (token) => api.get(`${BASE}/admin/session`, token ? {
  headers: { Authorization: `Bearer ${token}` },
} : undefined);
