import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core';

const persister = experimental_createQueryPersister({
  storage: AsyncStorage,
  maxAge: 1000 * 60 * 60 * 12, // 12시간
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      gcTime: 1000 * 60 * 30, // 30분
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,
      persister: persister.persisterFn,
    },
    mutations: {
      retry: 1,
    },
  },
});
