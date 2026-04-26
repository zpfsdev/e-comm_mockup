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
  const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
  
  if (currentPath.startsWith('/auth/')) {
    window.location.href = '/auth/sign-in';
    return;
  }
  
  const searchParams = new URLSearchParams();
  if (reason === 'session_expired') searchParams.set('reason', 'session_expired');
  searchParams.set('from', currentPath);

  const url = `/auth/sign-in?${searchParams.toString()}`;
  window.location.href = url;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
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

    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
      originalRequest.url?.includes('/auth/register') || 
      originalRequest.url?.includes('/auth/logout');


    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint ||
      typeof window === 'undefined'
    ) {
      return Promise.reject(error);
    }

    // If there is no token at all, the user is simply not authenticated.
    // Do NOT redirect or try to logout — just let the 401 propagate so the
    // calling component can show its own "please sign in" state.
    if (!tokenStore.get()) {
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
        typeof window !== 'undefined' ? localStorage.getItem(CSRF_TOKEN_KEY) : null;
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
      localStorage.removeItem(CSRF_TOKEN_KEY);
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
