import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export function useTrendingPosts() {
  return useQuery({
    queryKey: ['trendingPosts'],
    queryFn: async () => {
      const posts = await api.getTrendingPosts(72, 10);
      // 3개 미만이면 30일로 확장
      if (posts.length < 3) {
        return api.getTrendingPosts(720, 10);
      }
      return posts;
    },
    staleTime: 5 * 60 * 1000,
  });
}
