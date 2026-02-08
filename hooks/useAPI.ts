import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAPIResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAPI<T>(
  fetcher: () => Promise<T>,
  options?: { skip?: boolean }
): UseAPIResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<string | null>(null);
  
  // fetcher 참조를 useRef로 안정화하여 무한 루프 방지
  const fetcherRef = useRef(fetcher);
  
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcherRef.current();
      setData(result);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('[useAPI] 에러:', errorMessage, e);
    } finally {
      setLoading(false);
    }
  }, []); // 의존성 제거 - useRef를 사용하므로 안전

  useEffect(() => {
    if (!options?.skip) {
      refetch();
    }
  }, [refetch, options?.skip]);

  return { data, loading, error, refetch };
}
