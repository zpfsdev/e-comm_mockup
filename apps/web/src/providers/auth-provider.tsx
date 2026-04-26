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
    const bootstrap = async () => {
      // Always attempt a silent refresh — the HttpOnly refreshToken cookie may
      // still be valid even if the csrfToken was lost from localStorage (e.g.
      // server restart, browser restart, hard refresh). We send the CSRF token
      // if we have one.
      const csrfToken = localStorage.getItem(CSRF_TOKEN_KEY);
      try {
        const { data } = await axios.post<RefreshResponse>(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
          },
        );
        if (!isMounted) return;
        tokenStore.set(data.accessToken);
        setUser(data.user);
        // Re-persist CSRF token in case it was missing or rotated.
        if ((data as any).csrfToken) {
          localStorage.setItem(CSRF_TOKEN_KEY, (data as any).csrfToken);
        }
      } catch (err) {
        if (!isMounted) return;
        // Only destroy local session on a real auth rejection (401/403).
        // Network errors (ECONNREFUSED, server starting up, offline) must NOT
        // clear the CSRF token — the session is still valid, the API just isn't
        // ready yet.
        const status = axios.isAxiosError(err) ? err.response?.status : null;
        const isAuthFailure = status === 401 || status === 403;
        if (isAuthFailure) {
          tokenStore.clear();
          localStorage.removeItem(CSRF_TOKEN_KEY);
          document.cookie = 'session=; path=/; SameSite=Lax; max-age=0';
        }
        // For network errors: silently stay logged-out for this render cycle.
        // The user's session remains intact — next page load will succeed.
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
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
