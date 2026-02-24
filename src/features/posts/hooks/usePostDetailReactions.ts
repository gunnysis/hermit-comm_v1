import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { api } from '@/shared/lib/api';
import { useRealtimeReactions } from './useRealtimeReactions';
import type { Reaction } from '@/types';

/**
 * 게시글 반응 쿼리 + 실시간 구독 + 낙관적 업데이트 반응 핸들러.
 */
export function usePostDetailReactions(postId: number) {
  const queryClient = useQueryClient();
  const queryKey = ['reactions', postId];

  const { data: reactions = [], refetch: refetchReactions } = useQuery({
    queryKey,
    queryFn: () => api.getReactions(postId),
    enabled: postId > 0,
  });

  useRealtimeReactions({
    postId,
    onReactionsChange: refetchReactions,
  });

  const { mutate, isPending: reactionLoading } = useMutation({
    mutationFn: (reactionType: string) =>
      api.createReaction(postId, { reaction_type: reactionType }),

    onMutate: async (reactionType: string) => {
      // 진행 중인 쿼리 취소하여 낙관적 업데이트가 덮어쓰이지 않도록 함
      await queryClient.cancelQueries({ queryKey });

      // 이전 상태 스냅샷
      const previousReactions = queryClient.getQueryData<Reaction[]>(queryKey);

      // 낙관적으로 캐시 업데이트
      queryClient.setQueryData<Reaction[]>(queryKey, (old = []) => {
        const existing = old.find((r) => r.reaction_type === reactionType);
        if (existing) {
          return old.map((r) =>
            r.reaction_type === reactionType ? { ...r, count: r.count + 1 } : r,
          );
        }
        return [...old, { reaction_type: reactionType, count: 1 }];
      });

      return { previousReactions };
    },

    onError: (_error, _reactionType, context) => {
      // 오류 시 이전 상태로 롤백
      if (context?.previousReactions) {
        queryClient.setQueryData(queryKey, context.previousReactions);
      }
      Toast.show({
        type: 'error',
        text1: '반응 등록에 실패했어요',
        text2: '잠시 후 다시 시도해 주세요.',
      });
    },

    onSettled: () => {
      // 성공/실패 무관하게 서버와 동기화
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleReaction = useCallback(
    (reactionType: string) => {
      mutate(reactionType);
    },
    [mutate],
  );

  return { reactions, refetchReactions, handleReaction, reactionLoading };
}
