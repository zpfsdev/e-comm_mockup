import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './constants';

/** SessionStorage key for CSRF token (sent in X-CSRF-Token on /auth/refresh). */
export const CSRF_TOKEN_KEY = 'csrfToken';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

interface RetryableRequest extends AxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequest;

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      typeof window === 'undefined'
    ) {
      return Promise.reject(error);
    }

    if (!localStorage.getItem('accessToken')) {
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem(CSRF_TOKEN_KEY);
      document.cookie = 'session=; path=/; max-age=0';
      document.cookie = 'at=; path=/; max-age=0; Secure';
      window.location.href = '/auth/sign-in';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string | null>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers = originalRequest.headers ?? {};
        if (token) originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const csrfToken =
        typeof window !== 'undefined' ? sessionStorage.getItem(CSRF_TOKEN_KEY) : null;
      const { data } = await axios.post<{ accessToken: string }>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers:
            csrfToken != null ? { 'X-CSRF-Token': csrfToken } : undefined,
        },
      );
      const { accessToken } = data;
      localStorage.setItem('accessToken', accessToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      processQueue(null, accessToken);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem(CSRF_TOKEN_KEY);
      document.cookie = 'session=; path=/; max-age=0';
      document.cookie = 'at=; path=/; max-age=0; Secure';
      window.location.href = '/auth/sign-in';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
