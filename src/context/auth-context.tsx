import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { clearAuthStorage, getToken, setAuthTokens } from '@/utils/storage';
import { getUserInfoApi, loginApi } from '@/services/auth';

export interface AuthUser {
  buttons: string[];
  roles: string[];
  userId: string;
  userName: string;
}

interface AuthContextValue {
  initialized: boolean;
  isAuthenticated: boolean;
  login: (userName: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
  setSession: (token: string, refreshToken: string, user: AuthUser) => void;
  token: string;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState(getToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialized, setInitialized] = useState(() => !getToken());

  const logout = useCallback(() => {
    clearAuthStorage();
    setToken('');
    setUser(null);
  }, []);

  const setSession = useCallback((nextToken: string, refreshToken: string, nextUser: AuthUser) => {
    setAuthTokens(nextToken, refreshToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    if (!getToken()) {
      setUser(null);
      return null;
    }

    try {
      const nextUser = await getUserInfoApi();
      setUser(nextUser);
      return nextUser;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setInitialized(true);
      return;
    }

    let active = true;
    void getUserInfoApi()
      .then((nextUser) => {
        if (active) setUser(nextUser);
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => {
        if (active) setInitialized(true);
      });

    return () => {
      active = false;
    };
  }, [logout, token]);

  const login = useCallback(async (_userName: string, password: string): Promise<void> => {
    const { refreshToken, token: nextToken } = await loginApi(_userName, password);
    setAuthTokens(nextToken, refreshToken);
    setToken(nextToken);
    try {
      const nextUser = await getUserInfoApi();
      setUser(nextUser);
      setInitialized(true);
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  const value = useMemo(
    () => ({ initialized, isAuthenticated: Boolean(token), login, logout, refreshUser, setSession, token, user }),
    [initialized, login, logout, refreshUser, setSession, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
