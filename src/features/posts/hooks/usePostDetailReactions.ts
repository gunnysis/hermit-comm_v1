import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { useRealtimeReactions } from './useRealtimeReactions';

/**
 * 게시글 반응 쿼리 + 실시간 구독 + 반응 핸들러.
 */
export function usePostDetailReactions(postId: number) {
  const [reactionLoading, setReactionLoading] = useState(false);

  const { data: reactions = [], refetch: refetchReactions } = useQuery({
    queryKey: ['reactions', postId],
    queryFn: () => api.getReactions(postId),
    enabled: postId > 0,
  });

  useRealtimeReactions({
    postId,
    onReactionsChange: refetchReactions,
  });

  const handleReaction = useCallback(
    async (reactionType: string) => {
      try {
        setReactionLoading(true);
        await api.createReaction(postId, { reaction_type: reactionType });
        await refetchReactions();
      } finally {
        setReactionLoading(false);
      }
    },
    [postId, refetchReactions],
  );

  return { reactions, refetchReactions, handleReaction, reactionLoading };
}
