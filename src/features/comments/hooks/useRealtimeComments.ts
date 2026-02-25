import { useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { logger } from '@/shared/utils/logger';
import type { Comment } from '@/types';
import { isComment } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * 댓글 실시간 구독 훅
 *
 * @param postId - 구독할 게시글 ID
 * @param onInsert - 새 댓글이 추가될 때 호출되는 콜백
 * @param onDelete - 댓글이 삭제될 때 호출되는 콜백
 */
export function useRealtimeComments({
  postId,
  onInsert,
  onDelete,
}: {
  postId: number;
  onInsert?: (comment: Comment) => void;
  onDelete?: (commentId: number) => void;
}) {
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let mounted = true;

    const subscribe = async () => {
      try {
        logger.log('[Realtime] 댓글 구독 시작:', postId);

        channel = supabase
          .channel(`comments_${postId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'comments',
              filter: `post_id=eq.${postId}`,
            },
            (payload) => {
              if (!mounted) return;
              logger.log('[Realtime] 댓글 추가:', payload.new);
              try {
                if (onInsert && payload.new) {
                  if (isComment(payload.new)) {
                    onInsert(payload.new);
                  } else {
                    logger.error('[Realtime] 잘못된 Comment 데이터:', payload.new);
                  }
                }
              } catch (error) {
                logger.error('[Realtime] INSERT 콜백 에러:', error);
              }
            },
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'comments',
              filter: `post_id=eq.${postId}`,
            },
            (payload) => {
              if (!mounted) return;
              logger.log('[Realtime] 댓글 삭제:', payload.old);
              try {
                if (onDelete && payload.old) {
                  if (isComment(payload.old)) {
                    onDelete(payload.old.id);
                  } else {
                    logger.error('[Realtime] 잘못된 Comment 데이터:', payload.old);
                  }
                }
              } catch (error) {
                logger.error('[Realtime] DELETE 콜백 에러:', error);
              }
            },
          )
          .subscribe((status, err) => {
            if (!mounted) return;

            logger.log('[Realtime] 구독 상태:', status);

            if (status === 'CHANNEL_ERROR') {
              logger.warn('[Realtime] 채널 에러:', err);
            } else if (status === 'TIMED_OUT') {
              logger.warn('[Realtime] 타임아웃');
            } else if (status === 'CLOSED') {
              logger.warn('[Realtime] 채널 닫힘');
            }
          });
      } catch (error) {
        logger.error('[Realtime] 구독 설정 실패:', error);
      }
    };

    subscribe();

    // 클린업: 컴포넌트 언마운트 시 구독 해제
    return () => {
      mounted = false;
      if (channel) {
        logger.log('[Realtime] 댓글 구독 해제');
        supabase.removeChannel(channel).catch((err) => {
          logger.error('[Realtime] 채널 제거 실패:', err);
        });
      }
    };
  }, [postId, onInsert, onDelete]);
}
