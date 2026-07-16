import { createContext, useCallback, useContext, useMemo, useState } from 'react';
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

  const login = useCallback(async (userName: string, password: string): Promise<void> => {
    const { refreshToken, token: nextToken } = await loginApi(userName, password);
    setAuthTokens(nextToken, refreshToken);
    setToken(nextToken);
    await refreshUser();
  }, [refreshUser]);

  const value = useMemo(
    () => ({ isAuthenticated: Boolean(token), login, logout, refreshUser, setSession, token, user }),
    [login, logout, refreshUser, setSession, token, user]
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
