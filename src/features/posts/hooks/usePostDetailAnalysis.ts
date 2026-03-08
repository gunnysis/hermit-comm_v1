import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { supabase } from '@/shared/lib/supabase';
import type { PostAnalysis } from '@/types';

/** 폴링 최대 시간 (2분). 이후 강제 중단. */
const MAX_POLLING_MS = 2 * 60 * 1000;

/** Fallback 최대 재시도 횟수 */
const MAX_FALLBACK_RETRIES = 2;

/** Fallback 지연 시간 (ms) — 10초, 20초 */
const FALLBACK_DELAYS = [10_000, 20_000];

/**
 * 게시글 감정 분석 쿼리 + Realtime 구독 + 상태 기반 폴링 + 단계적 on-demand fallback.
 *
 * 전략:
 *  1. post_analysis Realtime 구독으로 INSERT/UPDATE 감지
 *  2. pending/analyzing 상태면 5초 간격 폴링 (최대 2분)
 *  3. 10초/20초 후 여전히 미완료이면 analyze-post-on-demand 호출 (최대 2회)
 *  4. Realtime이 변경을 감지하면 자동 invalidate
 *  5. 글 수정 시 DB 트리거가 자동 재분석 → UPSERT → UPDATE 이벤트 수신
 */
export function usePostDetailAnalysis(postId: number) {
  const queryClient = useQueryClient();
  const fallbackCountRef = useRef(0);
  const pollingStartRef = useRef<number>(0);

  // postId 변경 시 초기화
  useEffect(() => {
    fallbackCountRef.current = 0;
    pollingStartRef.current = Date.now();
  }, [postId]);

  const { data: postAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['postAnalysis', postId],
    queryFn: () => api.getPostAnalysis(postId),
    enabled: postId > 0,
    staleTime: 5 * 60 * 1000,
    // pending/analyzing 상태면 5초 간격 폴링 → done/failed 시 중단
    refetchInterval: (query) => {
      const status = (query.state.data as PostAnalysis | null | undefined)?.status;
      if (status === 'done') return false;
      if (status === 'failed') {
        const retryCount = (query.state.data as PostAnalysis | null | undefined)?.retry_count ?? 0;
        if (retryCount >= 3) return false;
      }

      // 폴링 최대 시간 초과 시 강제 중단
      if (Date.now() - pollingStartRef.current > MAX_POLLING_MS) {
        return false;
      }

      return status === 'pending' || status === 'analyzing' ? 5000 : false;
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

  // 단계적 on-demand fallback: 10초 → 20초
  useEffect(() => {
    if (postId <= 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    const tryFallback = async (attempt: number) => {
      // 이미 충분히 재시도했으면 스킵
      if (attempt >= MAX_FALLBACK_RETRIES) return;

      const cached = queryClient.getQueryData<PostAnalysis | null>(['postAnalysis', postId]);

      // 이미 완료됐으면 스킵
      if (cached?.status === 'done') return;
      if (cached?.status === 'failed' && (cached.retry_count ?? 0) >= 3) return;

      const needsFallback =
        cached === null ||
        cached === undefined ||
        cached.status === 'pending' ||
        cached.status === 'analyzing' ||
        cached.status === 'failed';

      if (!needsFallback) return;

      fallbackCountRef.current = attempt + 1;

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
      // 만약 Realtime이 놓칠 경우를 대비해 3초 후 수동 refetch
      const innerTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['postAnalysis', postId] });
      }, 3000);
      timers.push(innerTimer);
    };

    // 단계적 fallback 스케줄
    FALLBACK_DELAYS.forEach((delay, i) => {
      const timer = setTimeout(() => tryFallback(i), delay);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [postId, queryClient]);

  return { postAnalysis, analysisLoading };
}
