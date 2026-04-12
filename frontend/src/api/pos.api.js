import api from './axios';

const BASE = 'http://localhost:4005';

export const createSale = (data) => api.post(`${BASE}/pos/sales`, data);
export const getSale = (id) => api.get(`${BASE}/pos/sales/${id}`);
export const cancelSale = (id) => api.patch(`${BASE}/pos/sales/${id}/cancel`);
export const createPayment = (data) => api.post(`${BASE}/pos/payments`, data);
export const createRefund = (data) => api.post(`${BASE}/pos/refunds`, data);
export const createCustomer = (data) => api.post(`${BASE}/pos/customers`, data);
export const getCustomer = (id) => api.get(`${BASE}/pos/customers/${id}`);
export const updateCustomer = (id, data) => api.patch(`${BASE}/pos/customers/${id}`, data);
export const getCustomerHistory = (id) => api.get(`${BASE}/pos/customers/${id}/history`);
export const submitFeedback = (data) => api.post(`${BASE}/pos/customers/feedback`, data);
export const getCustomerSummary = (id) => api.get(`${BASE}/pos/customers/${id}/summary`);
export const getDailyRevenue = () => api.get(`${BASE}/pos/analytics/daily-revenue`);
export const getPaymentBreakdown = () => api.get(`${BASE}/pos/analytics/payment-breakdown`);
export const getTopProducts = () => api.get(`${BASE}/pos/analytics/top-products`);
