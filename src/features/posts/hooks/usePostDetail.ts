import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export function usePostDetail(postId: number | null) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => api.getPost(postId!),
    enabled: postId != null && !Number.isNaN(postId),
  });
}
