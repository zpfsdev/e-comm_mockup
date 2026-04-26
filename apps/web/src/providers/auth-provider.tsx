'use client';

import axios from 'axios';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, CSRF_TOKEN_KEY } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';
import { tokenStore } from '@/lib/token-store';
import type { AuthResponse, AuthUser } from '@/types/auth';

interface RefreshResponse {
  accessToken: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Call after a successful login/register API response to hydrate auth state. */
  login: (data: AuthResponse) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

    const tryRefresh = async (csrfToken: string | null): Promise<'ok' | 'auth-failure' | 'network-error'> => {
      try {
        const { data } = await axios.post<RefreshResponse>(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
          },
        );
        if (!isMounted) return 'ok';
        tokenStore.set(data.accessToken);
        setUser(data.user);
        if ((data as any).csrfToken) {
          localStorage.setItem(CSRF_TOKEN_KEY, (data as any).csrfToken);
        }
        return 'ok';
      } catch (err) {
        const status = axios.isAxiosError(err) ? err.response?.status : null;
        if (status === 401 || status === 403) return 'auth-failure';
        return 'network-error';
      }
    };

    const bootstrap = async () => {
      // Always attempt a silent refresh — the HttpOnly refreshToken cookie may
      // still be valid even if the csrfToken was lost from localStorage (e.g.
      // server restart, browser restart, hard refresh).
      const csrfToken = localStorage.getItem(CSRF_TOKEN_KEY);

      // Retry up to 4 times with exponential backoff to handle the race where
      // the web server is ready but the API server is still starting up
      // (ECONNREFUSED). Delays: 500ms → 1s → 2s → 4s.
      const delays = [500, 1000, 2000, 4000];

      for (let attempt = 0; attempt <= delays.length; attempt++) {
        if (!isMounted) return;

        const result = await tryRefresh(csrfToken);

        if (result === 'ok') {
          // Successfully restored session.
          break;
        }

        if (result === 'auth-failure') {
          // Actual 401/403 — the session is genuinely expired. Clear everything.
          tokenStore.clear();
          localStorage.removeItem(CSRF_TOKEN_KEY);
          document.cookie = 'session=; path=/; SameSite=Lax; max-age=0';
          break;
        }

        // Network error — API not ready yet. Retry after backoff if attempts remain.
        if (attempt < delays.length) {
          await sleep(delays[attempt]);
        }
        // On last attempt: give up silently. localStorage is untouched so the
        // next page load will retry automatically.
      }

      if (isMounted) setIsLoading(false);
    };

    void bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((data: AuthResponse): void => {
    tokenStore.set(data.accessToken);
    if (data.csrfToken) {
      // Store in localStorage so the token survives tab/browser close.
      localStorage.setItem(CSRF_TOKEN_KEY, data.csrfToken);
    }
    document.cookie = 'session=1; path=/; SameSite=Lax; max-age=86400';
    setUser(data.user);
  }, []);

  const logout = useCallback((): void => {
    // Call the server-side logout endpoint to clear HttpOnly cookies, then
    // tear down the local session regardless of network outcome.
    apiClient.post('/auth/logout').finally(() => {
      tokenStore.clear();
      localStorage.removeItem(CSRF_TOKEN_KEY);
      document.cookie = 'session=; path=/; SameSite=Lax; max-age=0';
      setUser(null);
      window.location.href = '/';
    });
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    const csrfToken = localStorage.getItem(CSRF_TOKEN_KEY);
    if (!csrfToken) return;

    try {
      const { data } = await axios.post<RefreshResponse>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true, headers: { 'X-CSRF-Token': csrfToken } },
      );
      tokenStore.set(data.accessToken);
      setUser(data.user);
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
