import { useCallback, useRef, useState } from 'react';

export interface LatestRequestState<T> {
  data?: T;
  error?: unknown;
  loading: boolean;
  run: (request: () => Promise<T>) => Promise<T | undefined>;
}

/** Commits async state only when it belongs to the most recently started request. */
export function useLatestRequest<T>(): LatestRequestState<T> {
  const sequence = useRef(0);
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (request: () => Promise<T>) => {
    const currentSequence = ++sequence.current;
    setError(undefined);
    setLoading(true);

    try {
      const result = await request();

      if (currentSequence === sequence.current) {
        setData(result);
      }

      return result;
    } catch (requestError) {
      if (currentSequence === sequence.current) {
        setError(requestError);
      }

      return undefined;
    } finally {
      if (currentSequence === sequence.current) {
        setLoading(false);
      }
    }
  }, []);

  return { data, error, loading, run };
}
