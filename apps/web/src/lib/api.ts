import axios from 'axios';
import { getGuestSessionId } from './session';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach guest session ID on every request so the cart API can resolve guest carts
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    config.headers['X-Session-Id'] = getGuestSessionId();
  }
  return config;
});

const AUTH_ENDPOINTS = ['/auth/me', '/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => originalRequest?.url?.includes(path));

    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
