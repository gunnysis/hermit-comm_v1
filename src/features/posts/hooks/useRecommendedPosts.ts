import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import type { RecommendedPost } from '@/types';

/**
 * 감정 기반 추천 게시글을 조회하는 훅.
 * 현재 게시글과 유사한 감정의 다른 게시글을 반환합니다.
 */
export function useRecommendedPosts(postId: number) {
  return useQuery<RecommendedPost[]>({
    queryKey: ['recommendedPosts', postId],
    queryFn: () => api.getRecommendedPosts(postId),
    enabled: postId > 0,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
