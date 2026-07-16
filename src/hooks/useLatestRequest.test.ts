import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useLatestRequest } from './useLatestRequest';

function createDeferred<T>() {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: T | PromiseLike<T>) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

describe('useLatestRequest', () => {
  it('keeps the newer result when an older request resolves last', async () => {
    const first = createDeferred<string>();
    const second = createDeferred<string>();
    const { result } = renderHook(() => useLatestRequest<string>());

    let firstRequest!: Promise<string | undefined>;
    let secondRequest!: Promise<string | undefined>;

    act(() => {
      firstRequest = result.current.run(() => first.promise);
      secondRequest = result.current.run(() => second.promise);
    });

    await act(async () => {
      second.resolve('newest');
      await secondRequest;
    });

    await act(async () => {
      first.resolve('stale');
      await firstRequest;
    });

    expect(result.current.data).toBe('newest');
    expect(result.current.loading).toBe(false);
  });
});
