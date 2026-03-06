import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { supabase } from '@/shared/lib/supabase';
import type { PostAnalysis } from '@/types';

/**
 * 게시글 감정 분석 쿼리 + Realtime 구독 + 상태 기반 폴링 + 15초 후 on-demand fallback.
 *
 * 전략:
 *  1. post_analysis Realtime 구독으로 INSERT/UPDATE 감지
 *  2. pending/analyzing 상태면 3초 간격 폴링
 *  3. 15초 경과 후 여전히 pending/analyzing이면 analyze-post-on-demand 호출
 *  4. Realtime이 변경을 감지하면 자동 invalidate
 *  5. 글 수정 시 DB 트리거가 자동 재분석 → UPSERT → UPDATE 이벤트 수신
 */
export function usePostDetailAnalysis(postId: number) {
  const queryClient = useQueryClient();
  const fallbackCalledRef = useRef(false);

  // postId 변경 시 fallback 플래그 초기화
  useEffect(() => {
    fallbackCalledRef.current = false;
  }, [postId]);

  const { data: postAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['postAnalysis', postId],
    queryFn: () => api.getPostAnalysis(postId),
    enabled: postId > 0,
    staleTime: 5 * 60 * 1000,
    // pending/analyzing 상태면 3초 간격 폴링 → done/failed 시 중단
    refetchInterval: (query) => {
      const status = (query.state.data as PostAnalysis | null | undefined)?.status;
      return status === 'pending' || status === 'analyzing' ? 3000 : false;
    },
  });

  // Realtime 구독: post_analysis INSERT/UPDATE 감지 (글 수정 시 재분석 포함)
  useEffect(() => {
    const channel = supabase
      .channel(`post-analysis-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_analysis',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['postAnalysis', postId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);

  // On-demand 폴백: 15초 후 status가 여전히 pending/analyzing이면 수동 분석 요청
  useEffect(() => {
    if (postId <= 0) return;

    let innerTimer: ReturnType<typeof setTimeout> | undefined;

    const timer = setTimeout(async () => {
      if (fallbackCalledRef.current) return;
      const cached = queryClient.getQueryData<PostAnalysis | null>(['postAnalysis', postId]);

      // status 기반: 아직 완료/실패가 아닌 경우에만 폴백
      const needsFallback =
        cached === null ||
        cached === undefined ||
        cached.status === 'pending' ||
        cached.status === 'analyzing';

      if (needsFallback) {
        fallbackCalledRef.current = true;
        const currentPost = queryClient.getQueryData<{ content?: string; title?: string }>([
          'post',
          postId,
        ]);
        if (currentPost?.content) {
          await api.invokeSmartService(postId, currentPost.content, currentPost.title);
        } else {
          // content 없으면 postId만 전달 (on-demand가 DB에서 조회)
          await api.invokeSmartService(postId, '');
        }
        // Realtime이 INSERT를 감지하여 자동 invalidate됨
        // 만약 Realtime이 놓칠 경우를 대비해 5초 후 수동 refetch
        innerTimer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['postAnalysis', postId] });
        }, 5000);
      }
    }, 15000);

    return () => {
      clearTimeout(timer);
      clearTimeout(innerTimer);
    };
  }, [postId, queryClient]);

  return { postAnalysis, analysisLoading };
}
