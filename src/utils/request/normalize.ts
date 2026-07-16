import type { BaseResponse, PaginatedResult } from '@/types/api';

export function normalizeBackendData<T>(data: T, unwrapData = true): T | (T extends Array<infer Item> ? Item : T) | null {
  if (!unwrapData || !Array.isArray(data)) {
    return data;
  }

  if (data.length === 0) {
    return null;
  }

  return (data.length === 1 ? data[0] : data) as T | (T extends Array<infer Item> ? Item : T);
}

export function normalizeResponse<T>(response: BaseResponse<T>): T | PaginatedResult<T extends Array<infer Item> ? Item : never> | null {
  if (response.pagination) {
    return {
      list: Array.isArray(response.data) ? response.data : [],
      pagination: response.pagination,
      total: response.pagination.total
    } as PaginatedResult<T extends Array<infer Item> ? Item : never>;
  }

  return normalizeBackendData(response.data as T) as T | null;
}
