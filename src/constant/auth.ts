export const AUTH_STORAGE_KEYS = {
  refreshToken: 'DAG_refreshToken',
  token: 'DAG_token'
} as const;

export const EXPIRED_TOKEN_CODES = new Set(['3333', '9998', '9999']);
export const LOGOUT_CODES = new Set(['8888', '8889']);
export const MODAL_LOGOUT_CODES = new Set(['7777', '7778']);
export const SUCCESS_CODE = '0';
