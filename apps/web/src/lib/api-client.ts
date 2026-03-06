import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './constants';
import { tokenStore } from './token-store';

/** SessionStorage key for CSRF token (sent in X-CSRF-Token on /auth/refresh). */
export const CSRF_TOKEN_KEY = 'csrfToken';

/** Query param set when redirecting to sign-in after session expiry (refresh failed or no token). */
export const SESSION_EXPIRED_PARAM = 'reason=session_expired';

const LOGOUT_TIMEOUT_MS = 2500;

function redirectToSignIn(reason?: 'session_expired'): void {
  const url = reason === 'session_expired'
    ? `/auth/sign-in?${SESSION_EXPIRED_PARAM}`
    : '/auth/sign-in';
  window.location.href = url;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

    if (!tokenStore.get()) {
      sessionStorage.removeItem(CSRF_TOKEN_KEY);
      const logoutPromise = apiClient.post('/auth/logout').catch(() => {});
      const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, LOGOUT_TIMEOUT_MS));
      void Promise.race([logoutPromise, timeoutPromise]).then(() => {
        redirectToSignIn('session_expired');
      });
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
      tokenStore.set(accessToken);
      processQueue(null, accessToken);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStore.clear();
      sessionStorage.removeItem(CSRF_TOKEN_KEY);
      const logoutPromise = apiClient.post('/auth/logout').catch(() => {});
      const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, LOGOUT_TIMEOUT_MS));
      void Promise.race([logoutPromise, timeoutPromise]).then(() => {
        redirectToSignIn('session_expired');
      });
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
