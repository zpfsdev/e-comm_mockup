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
      const csrfToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
      if (!csrfToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }
      // Restore the in-memory access token by silently refreshing via the
      // HttpOnly refresh-token cookie. The refresh response now includes the
      // user summary, eliminating the separate GET /auth/me round-trip.
      try {
        const { data } = await axios.post<RefreshResponse>(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true, headers: { 'X-CSRF-Token': csrfToken } },
        );
        if (!isMounted) return;
        tokenStore.set(data.accessToken);
        setUser(data.user);
      } catch {
        tokenStore.clear();
        sessionStorage.removeItem(CSRF_TOKEN_KEY);
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
      sessionStorage.setItem(CSRF_TOKEN_KEY, data.csrfToken);
    }
    document.cookie = 'session=1; path=/; SameSite=Lax; max-age=86400';
    setUser(data.user);
  }, []);

  const logout = useCallback((): void => {
    // Call the server-side logout endpoint to clear HttpOnly cookies, then
    // tear down the local session regardless of network outcome.
    apiClient.post('/auth/logout').finally(() => {
      tokenStore.clear();
      sessionStorage.removeItem(CSRF_TOKEN_KEY);
      setUser(null);
      window.location.href = '/';
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: !!user, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
