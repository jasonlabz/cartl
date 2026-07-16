import { AUTH_STORAGE_KEYS } from '@/constant/auth';

export function clearAuthStorage(): void {
  localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.token);
}

export function getRefreshToken(): string {
  return localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken) ?? '';
}

export function getToken(): string {
  return localStorage.getItem(AUTH_STORAGE_KEYS.token) ?? '';
}

export function setAuthTokens(token: string, refreshToken: string): void {
  localStorage.setItem(AUTH_STORAGE_KEYS.token, token);
  localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
}
