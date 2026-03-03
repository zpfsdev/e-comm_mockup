'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';

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
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setTimeout(() => setIsLoading(false), 0);
      return;
    }
    apiClient
      .get<User>('/auth/me')
      .then((res) => {
        setUser(res.data);
        document.cookie = 'session=1; path=/; SameSite=Lax; max-age=86400';
      })
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setIsLoading(false));
  }, []);

  const logout = useCallback((): void => {
    localStorage.removeItem('accessToken');
    document.cookie = 'session=; path=/; max-age=0';
    setUser(null);
    window.location.href = '/';
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: !!user, setUser, logout }),
    [user, isLoading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
