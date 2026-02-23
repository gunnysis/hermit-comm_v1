import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

/**
 * 게시글 감정 분석 쿼리 + 14초 후 smart-service fallback.
 * DB Webhook 실패·지연 시 직접 호출.
 */
export function usePostDetailAnalysis(postId: number) {
  const queryClient = useQueryClient();

  const { data: postAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['postAnalysis', postId],
    queryFn: () => api.getPostAnalysis(postId),
    enabled: postId > 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data !== undefined && data !== null) return false;
      const updated = query.state.dataUpdatedAt;
      if (updated && Date.now() - updated > 12000) return false;
      return 1500;
    },
    refetchIntervalInBackground: false,
  });

  const fallbackCalledRef = useRef(false);
  useEffect(() => {
    if (postId <= 0) return;
    fallbackCalledRef.current = false;

    const timer = setTimeout(async () => {
      if (fallbackCalledRef.current) return;
      const cached = queryClient.getQueryData<{ emotions: string[] } | null>([
        'postAnalysis',
        postId,
      ]);
      const currentPost = queryClient.getQueryData<{ content?: string; title?: string }>([
        'post',
        postId,
      ]);
      if (cached === null && currentPost?.content) {
        fallbackCalledRef.current = true;
        await api.invokeSmartService(postId, currentPost.content, currentPost.title);
        queryClient.invalidateQueries({ queryKey: ['postAnalysis', postId] });
      }
    }, 14000);

    return () => clearTimeout(timer);
  }, [postId, queryClient]);

  return { postAnalysis, analysisLoading };
}
