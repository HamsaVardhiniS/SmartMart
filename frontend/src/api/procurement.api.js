import api from './axios';

const BASE = 'http://localhost:4006';

export const getOrders = () => api.get(`${BASE}/procurement/orders`);
export const createOrder = (data) => api.post(`${BASE}/procurement/orders`, data);
export const addOrderItems = (orderId, data) => api.post(`${BASE}/procurement/orders/${orderId}/items`, data);
export const receiveItem = (itemId, data) => api.post(`${BASE}/procurement/items/${itemId}/receive`, data);
export const cancelOrder = (orderId) => api.patch(`${BASE}/procurement/orders/${orderId}/cancel`);
export const recordPayment = (data) => api.post(`${BASE}/procurement/payments`, data);
export const getSuppliers = () => api.get(`${BASE}/procurement/suppliers`);
export const createSupplier = (data) => api.post(`${BASE}/procurement/suppliers`, data);
export const getSupplier = (id) => api.get(`${BASE}/procurement/suppliers/${id}`);
export const updateSupplier = (id, data) => api.put(`${BASE}/procurement/suppliers/${id}`, data);
export const deactivateSupplier = (id) => api.patch(`${BASE}/procurement/suppliers/${id}/deactivate`);
