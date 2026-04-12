import api from './axios';

const BASE = 'http://localhost:4001';

export const createRole = (data) => api.post(`${BASE}/admin/roles`, data);
export const assignPermission = (data) => api.post(`${BASE}/admin/permissions/assign`, data);
export const createUser = (data) => api.post(`${BASE}/admin/users`, data);
export const getConfig = () => api.get(`${BASE}/admin/config`);
export const setConfig = (data) => api.post(`${BASE}/admin/config`, data);
export const setFeature = (data) => api.post(`${BASE}/admin/feature`, data);
export const createApproval = (data) => api.post(`${BASE}/admin/approvals`, data);
export const approveRequest = (id, data) => api.patch(`${BASE}/admin/approvals/${id}/approve`, data);
export const getLogs = () => api.get(`${BASE}/admin/logs`);
export const resetPassword = (data) => api.post(`${BASE}/admin/reset-password`, data);
export const createDepartment = (data) => api.post(`${BASE}/admin/departments`, data);
