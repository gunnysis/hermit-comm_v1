import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.silent) return;
      Toast.show({
        type: 'error',
        text1: error.message || '데이터를 불러올 수 없어요',
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silent) return;
      Toast.show({
        type: 'error',
        text1: error.message || '요청에 실패했어요',
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2분 (앱 특성에 맞게 조정)
      gcTime: 1000 * 60 * 30, // 30분
      retry: (failureCount, error) => {
        // 4xx 에러는 재시도 안함 (웹과 동일 전략)
        if (error instanceof Error && /\b4\d{2}\b/.test(error.message)) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
