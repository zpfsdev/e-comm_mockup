'use client';

import axios from 'axios';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, CSRF_TOKEN_KEY } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';
import { tokenStore } from '@/lib/token-store';

interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const csrfToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    if (!csrfToken) {
      setIsLoading(false);
      return;
    }
    // Restore the in-memory access token by silently refreshing via the
    // HttpOnly refresh-token cookie. The CSRF token in sessionStorage confirms
    // this tab belongs to an authenticated session.
    axios
      .post<{ accessToken: string }>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true, headers: { 'X-CSRF-Token': csrfToken } },
      )
      .then(({ data }) => {
        tokenStore.set(data.accessToken);
        return apiClient.get<User>('/auth/me');
      })
      .then((res) => {
        setUser(res.data);
        document.cookie = 'session=1; path=/; SameSite=Lax; max-age=86400';
      })
      .catch(() => {
        tokenStore.clear();
        sessionStorage.removeItem(CSRF_TOKEN_KEY);
        document.cookie = 'session=; path=/; max-age=0';
        document.cookie = 'at=; path=/; max-age=0; Secure';
      })
      .finally(() => setIsLoading(false));
  }, []);

  const logout = useCallback((): void => {
    // Call the server-side logout endpoint to clear HttpOnly cookies, then
    // tear down the local session regardless of network outcome.
    apiClient.post('/auth/logout').finally(() => {
      tokenStore.clear();
      sessionStorage.removeItem(CSRF_TOKEN_KEY);
      document.cookie = 'session=; path=/; max-age=0';
      setUser(null);
      window.location.href = '/';
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: !!user, setUser, logout }),
    [user, isLoading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
