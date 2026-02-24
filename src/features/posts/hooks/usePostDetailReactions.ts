import { useCallback, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { useRealtimeReactions } from './useRealtimeReactions';

/**
 * 게시글 반응 쿼리 + 실시간 구독 + 반응 토글 핸들러.
 * - pendingTypes: 현재 처리 중인 반응 타입 Set (반응별 연타 방지)
 * - userReactedTypes: 현재 사용자가 남긴 반응 타입 목록 (취소 표시용)
 */
export function usePostDetailReactions(postId: number) {
  const pendingRef = useRef<Set<string>>(new Set());
  const [pendingTypes, setPendingTypes] = useState<Set<string>>(new Set());

  const { data: reactions = [], refetch: refetchReactions } = useQuery({
    queryKey: ['reactions', postId],
    queryFn: () => api.getReactions(postId),
    enabled: postId > 0,
  });

  const { data: userReactedTypes = [], refetch: refetchUserReactions } = useQuery({
    queryKey: ['userReactions', postId],
    queryFn: () => api.getUserReactions(postId),
    enabled: postId > 0,
  });

  useRealtimeReactions({
    postId,
    onReactionsChange: () => {
      refetchReactions();
      refetchUserReactions();
    },
  });

  const handleReaction = useCallback(
    async (reactionType: string) => {
      // 해당 반응 타입이 처리 중이면 연타 무시
      if (pendingRef.current.has(reactionType)) return;

      pendingRef.current.add(reactionType);
      setPendingTypes(new Set(pendingRef.current));

      try {
        await api.toggleReaction(postId, reactionType);
        await Promise.all([refetchReactions(), refetchUserReactions()]);
      } finally {
        pendingRef.current.delete(reactionType);
        setPendingTypes(new Set(pendingRef.current));
      }
    },
    [postId, refetchReactions, refetchUserReactions],
  );

  return { reactions, userReactedTypes, handleReaction, pendingTypes };
}
