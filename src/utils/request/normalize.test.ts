import { describe, expect, it } from 'vitest';

import { normalizeBackendData, normalizeResponse } from './normalize';

describe('normalizeResponse', () => {
  it('returns a paginated list with its source pagination metadata', () => {
    expect(
      normalizeResponse({
        code: 0,
        data: [{ id: 1 }],
        message: 'ok',
        pagination: { page: 2, page_count: 3, page_size: 10, total: 21 }
      })
    ).toEqual({
      list: [{ id: 1 }],
      pagination: { page: 2, page_count: 3, page_size: 10, total: 21 },
      total: 21
    });
  });

  it('unwraps list responses with source-compatible rules', () => {
    expect(normalizeBackendData([])).toBeNull();
    expect(normalizeBackendData([{ id: 1 }])).toEqual({ id: 1 });
    expect(normalizeBackendData([{ id: 1 }, { id: 2 }])).toEqual([{ id: 1 }, { id: 2 }]);
    expect(normalizeBackendData([{ id: 1 }], false)).toEqual([{ id: 1 }]);
  });
});
