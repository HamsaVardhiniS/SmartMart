import axios from 'axios';
import { clearStoredAuth, isTokenExpired, readStoredAuth } from '../lib/auth';

const instance = axios.create({
  baseURL: '',
  timeout: 15000,
});

instance.interceptors.request.use(config => {
  const requestUrl = String(config.url || '');
  const isAuthRequest = requestUrl.includes('/admin/login');
  const storedAuth = readStoredAuth();
  const token = storedAuth?.token;

  if (!isAuthRequest && token && isTokenExpired(token)) {
    clearStoredAuth();
    window.location.href = '/login?reason=expired';
    return Promise.reject(new axios.Cancel('Token expired'));
  }

  if (!isAuthRequest && token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

instance.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      clearStoredAuth();
      window.location.href = '/login?reason=expired';
    }
    return Promise.reject(err);
  }
);

export default instance;
