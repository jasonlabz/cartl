import { describe, expect, it } from 'vitest';

import { BaseRequest } from './index';

describe('BaseRequest', () => {
  it('sends the access token and retries expired responses after one refresh', async () => {
    const requests: Array<{ authorization?: string; url?: string }> = [];
    let refreshes = 0;
    let token = 'old-token';

    const request = new BaseRequest({
      getToken: () => token,
      refreshToken: async () => {
        refreshes += 1;
        token = 'new-token';
        return true;
      },
      transport: async (config) => {
        requests.push({
          authorization: config.headers?.Authorization as string | undefined,
          url: config.url
        });

        if (requests.length === 1) {
          return { data: { code: 9999, data: null, message: 'expired' }, status: 200 };
        }

        return { data: { code: 0, data: { id: 8 }, message: 'ok' }, status: 200 };
      }
    });

    await expect(request.get<{ id: number }>('/api/example')).resolves.toEqual({ id: 8 });
    expect(refreshes).toBe(1);
    expect(requests).toEqual([
      { authorization: 'Bearer old-token', url: '/api/example' },
      { authorization: 'Bearer new-token', url: '/api/example' }
    ]);
  });

  it('does not attempt a refresh loop when the retried request is still expired', async () => {
    let refreshes = 0;

    const request = new BaseRequest({
      getToken: () => 'token',
      refreshToken: async () => {
        refreshes += 1;
        return true;
      },
      transport: async () => ({ data: { code: 9999, data: null, message: 'expired' }, status: 200 })
    });

    await expect(request.get('/api/example')).rejects.toThrow('expired');
    expect(refreshes).toBe(1);
  });
});
