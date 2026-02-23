import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

/**
 * 게시글 감정 분석 쿼리 + 14초 후 analyze-post-on-demand fallback.
 * DB 트리거/Webhook 실패·지연 시 직접 호출.
 *
 * 폴링 설계:
 *  - 1.5초 간격으로 최대 12초 동안 post_analysis 조회 (마운트 시점 기준)
 *  - 12초 경과 후 폴링 중단 → 14초에 fallback 실행
 *  - 분석 결과 도착 시 즉시 폴링 중단
 */
export function usePostDetailAnalysis(postId: number) {
  const queryClient = useQueryClient();

  // 폴링 시작 시점 추적 (dataUpdatedAt은 refetch마다 갱신되므로 사용 불가)
  const pollingStartRef = useRef<number>(0);
  const fallbackCalledRef = useRef(false);

  // postId 변경 시 폴링 시작 시점과 fallback 플래그 초기화
  useEffect(() => {
    pollingStartRef.current = Date.now();
    fallbackCalledRef.current = false;
  }, [postId]);

  const { data: postAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['postAnalysis', postId],
    queryFn: () => api.getPostAnalysis(postId),
    enabled: postId > 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      // 분석 결과 도착 시 즉시 중단
      if (data !== undefined && data !== null) return false;
      // 마운트 후 12초 경과 시 중단 (14초 fallback에 위임)
      if (pollingStartRef.current && Date.now() - pollingStartRef.current > 12000) return false;
      return 1500;
    },
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (postId <= 0) return;

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
