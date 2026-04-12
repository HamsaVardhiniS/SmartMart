import api from './axios';

const BASE = 'http://localhost:4002';

export const getRevenue = () => api.get(`${BASE}/analytics/revenue`);
export const getProductsAnalytics = () => api.get(`${BASE}/analytics/products`);
export const getInventoryAnalytics = () => api.get(`${BASE}/analytics/inventory`);
export const getPayrollAnalytics = () => api.get(`${BASE}/analytics/payroll`);
export const getSuppliersAnalytics = () => api.get(`${BASE}/analytics/suppliers`);
