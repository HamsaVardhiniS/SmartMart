import api from './axios';

const BASE = 'http://localhost:4003';

export const createEmployee = (data) => api.post(`${BASE}/hr/employees`, data);
export const getEmployees = () => api.get(`${BASE}/hr/employees`);
export const updateEmployee = (id, data) => api.put(`${BASE}/hr/employees/${id}`, data);
export const updateEmployeeStatus = (id, data) => api.patch(`${BASE}/hr/employees/${id}/status`, data);
export const getDepartments = () => api.get(`${BASE}/hr/departments`);
export const createHRDepartment = (data) => api.post(`${BASE}/hr/departments`, data);
export const assignDepartment = (id, data) => api.patch(`${BASE}/hr/employees/${id}/department`, data);
export const assignManager = (id, data) => api.patch(`${BASE}/hr/departments/${id}/manager`, data);
export const checkIn = (data) => api.post(`${BASE}/hr/attendance/check-in`, data);
export const checkOut = (data) => api.post(`${BASE}/hr/attendance/check-out`, data);
export const getAttendance = (id) => api.get(`${BASE}/hr/attendance/${id}`);
export const applyLeave = (data) => api.post(`${BASE}/hr/leave`, data);
export const updateLeave = (id, data) => api.patch(`${BASE}/hr/leave/${id}`, data);
export const getLeaves = (id) => api.get(`${BASE}/hr/leave/${id}`);
export const getLeaveBalance = (id) => api.get(`${BASE}/hr/leave-balance/${id}`);
export const generatePayroll = (data) => api.post(`${BASE}/hr/payroll`, data);
export const getPayroll = (id) => api.get(`${BASE}/hr/payroll/${id}`);
export const getPayslip = (id) => api.get(`${BASE}/hr/payslip/${id}`);
