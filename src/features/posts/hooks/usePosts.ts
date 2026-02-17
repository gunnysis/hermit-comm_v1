import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

type SortOrder = 'latest' | 'popular';

export function usePosts(sortOrder: SortOrder) {
  return useQuery({
    queryKey: ['posts', sortOrder],
    queryFn: () => api.getPosts(20, 0, sortOrder),
    staleTime: 1000 * 60,
  });
}
