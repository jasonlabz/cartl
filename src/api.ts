const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, payload?.message || response.statusText);
  }

  return (payload?.data ?? payload) as T;
}

export const endpoints = {
  dashboard: '/api/v1/scheduler/dashboard',
  dataSources: '/api/v1/workflow/data-source',
  assets: '/api/v1/workflow/asset-repo',
  flows: '/api/v1/workflow/data-flow',
  qualityRules: '/api/v1/quality/rules',
  metadataStandards: '/api/v1/standards/metadata'
} as const;
