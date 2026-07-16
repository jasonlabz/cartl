import { request } from '@/utils/request';

export interface LoginToken {
  refreshToken: string;
  token: string;
}

export interface UserInfo {
  buttons: string[];
  roles: string[];
  userId: string;
  userName: string;
}

export function getUserInfoApi(): Promise<UserInfo> {
  return request.get<UserInfo>('/auth/getUserInfo');
}

export function loginApi(userName: string, password: string): Promise<LoginToken> {
  return request.post<LoginToken>('/auth/login', { data: { password, userName } });
}

export function refreshTokenApi(refreshToken: string): Promise<LoginToken> {
  return request.post<LoginToken>('/auth/refreshToken', { data: { refreshToken } });
}

export function customBackendErrorApi(code: string, msg: string): Promise<unknown> {
  return request.get('/auth/error', { params: { code, msg } });
}
