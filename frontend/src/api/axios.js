// frontend/src/api/axios.js
// Sets up the API client using Axios, injecting access tokens and handling automatic token refreshes via interceptors.
// Used in: Pages and stores for communication with the backend.

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Single-flight refresh so concurrent 401s trigger only one /auth/refresh call.
let refreshPromise = null;
async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
      .then((response) => response.data.accessToken)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Request interceptor: appends Bearer access token if available
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: catches 401 unauthorized errors and attempts access token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Never retry auth handshake calls (login/register/refresh/logout) — they
    // manage their own flows and retrying would loop.
    const isAuthHandshake =
      originalRequest?.url === '/auth/login' ||
      originalRequest?.url === '/auth/register' ||
      originalRequest?.url === '/auth/refresh' ||
      originalRequest?.url === '/auth/logout';

    // Attempt token refresh only on 401 authentication errors
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthHandshake
    ) {
      originalRequest._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        useAuthStore.getState().setAccessToken(accessToken);

        // Retry original request with the fresh token
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token has expired, log out the user
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { baseURL };
