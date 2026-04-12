import api from './axios';

const BASE = 'http://localhost:4004';

export const createProduct = (data) => api.post(`${BASE}/inventory/products`, data);
export const getProducts = () => api.get(`${BASE}/inventory/products`);
export const updateProduct = (id, data) => api.patch(`${BASE}/inventory/products/${id}`, data);
export const updateReorderLevel = (id, data) => api.patch(`${BASE}/inventory/products/${id}/reorder`, data);
export const updateTaxRate = (id, data) => api.patch(`${BASE}/inventory/products/${id}/tax`, data);
export const getProductStock = (id) => api.get(`${BASE}/inventory/products/${id}/stock`);
export const createBrand = (data) => api.post(`${BASE}/inventory/brands`, data);
export const getBrands = () => api.get(`${BASE}/inventory/brands`);
export const createCategory = (data) => api.post(`${BASE}/inventory/categories`, data);
export const getCategories = () => api.get(`${BASE}/inventory/categories`);
export const createSubcategory = (data) => api.post(`${BASE}/inventory/subcategories`, data);
export const getSubcategories = () => api.get(`${BASE}/inventory/subcategories`);
export const createBatch = (data) => api.post(`${BASE}/inventory/batches`, data);
export const adjustStock = (data) => api.post(`${BASE}/inventory/adjust`, data);
export const getStock = (product, branch) => api.get(`${BASE}/inventory/stock/${product}/${branch}`);
export const getLowStockReport = () => api.get(`${BASE}/inventory/reports/low-stock`);
export const getExpiryReport = () => api.get(`${BASE}/inventory/reports/expiry`);
export const getDeadStockReport = () => api.get(`${BASE}/inventory/reports/dead-stock`);
export const getValuationReport = () => api.get(`${BASE}/inventory/reports/valuation`);
