import axios from 'axios';
import type { AxiosRequestConfig, Method } from 'axios';

import { EXPIRED_TOKEN_CODES, LOGOUT_CODES, MODAL_LOGOUT_CODES, SUCCESS_CODE } from '@/constant/auth';
import type { BaseResponse } from '@/types/api';
import { normalizeResponse } from '@/utils/request/normalize';
import { clearAuthStorage, getRefreshToken, getToken, setAuthTokens } from '@/utils/storage';

export interface RequestConfig extends AxiosRequestConfig {
  unwrapData?: boolean;
}

export interface TransportResponse {
  data: BaseResponse<unknown>;
  status: number;
}

export type RequestTransport = (config: RequestConfig) => Promise<TransportResponse>;

export interface BaseRequestOptions {
  getToken: () => string;
  onAuthExpired?: () => void;
  onBackendError?: (message: string) => void;
  refreshToken: () => Promise<boolean>;
  transport: RequestTransport;
}

export class BackendRequestError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'BackendRequestError';
  }
}

export class BaseRequest {
  private refreshPromise: Promise<boolean> | null = null;

  constructor(private readonly options: BaseRequestOptions) {}

  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'delete', url });
  }

  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'get', url });
  }

  patch<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'patch', url });
  }

  post<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'post', url });
  }

  put<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'put', url });
  }

  async request<T>(config: RequestConfig, refreshed = false): Promise<T> {
    const response = await this.options.transport(this.withAuthorization(config));
    const code = String(response.data.code);

    if (code === SUCCESS_CODE) {
      return (config.unwrapData === false ? response.data.data : normalizeResponse(response.data)) as T;
    }

    if (EXPIRED_TOKEN_CODES.has(code) && !refreshed) {
      const refreshSucceeded = await this.refreshAccessToken();
      if (refreshSucceeded) {
        return this.request<T>(config, true);
      }
    }

    if (LOGOUT_CODES.has(code) || MODAL_LOGOUT_CODES.has(code) || EXPIRED_TOKEN_CODES.has(code)) {
      this.options.onAuthExpired?.();
    } else {
      this.options.onBackendError?.(response.data.message);
    }

    throw new BackendRequestError(code, response.data.message);
  }

  private refreshAccessToken(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.options.refreshToken().finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }

  private withAuthorization(config: RequestConfig): RequestConfig {
    const token = this.options.getToken();

    return {
      ...config,
      headers: {
        ...config.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };
  }
}

export type RequestMethod = Extract<Method, 'delete' | 'get' | 'patch' | 'post' | 'put'>;

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || undefined
});

const defaultTransport: RequestTransport = async (config: RequestConfig) => {
  const response = await httpClient.request<BaseResponse<unknown>>(config);

  return { data: response.data, status: response.status };
};

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await httpClient.post<BaseResponse<{ refreshToken: string; token: string }>>('/auth/refreshToken', {
      refreshToken
    });

    if (String(response.data.code) !== SUCCESS_CODE || !response.data.data) {
      return false;
    }

    setAuthTokens(response.data.data.token, response.data.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export const request = new BaseRequest({
  getToken,
  onAuthExpired: clearAuthStorage,
  refreshToken: refreshAccessToken,
  transport: defaultTransport
});
