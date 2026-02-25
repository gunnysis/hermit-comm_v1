import { useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import type { Post } from '@/types';
import { isPost } from '@/types';
import { logger } from '@/shared/utils/logger';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimePosts({
  onInsert,
  onDelete,
  onUpdate,
  enabled = true,
}: {
  onInsert?: (post: Post) => void;
  onDelete?: (postId: number) => void;
  onUpdate?: (post: Post) => void;
  /** 구독 활성화 여부 (기본값: true) */
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel | null = null;
    let mounted = true;

    const subscribe = async () => {
      try {
        channel = supabase
          .channel('posts_changes')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'posts' },
            (payload) => {
              if (!mounted) return;
              try {
                if (onInsert && payload.new && isPost(payload.new)) {
                  onInsert(payload.new);
                }
              } catch (error) {
                logger.error('[Realtime] INSERT 콜백 에러:', error);
              }
            },
          )
          .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'posts' },
            (payload) => {
              if (!mounted) return;
              try {
                if (onDelete && payload.old) {
                  if (isPost(payload.old)) {
                    onDelete(payload.old.id);
                  } else if (typeof (payload.old as { id?: number }).id === 'number') {
                    onDelete((payload.old as { id: number }).id);
                  }
                }
              } catch (error) {
                logger.error('[Realtime] DELETE 콜백 에러:', error);
              }
            },
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'posts' },
            (payload) => {
              if (!mounted) return;
              try {
                if (onUpdate && payload.new && isPost(payload.new)) {
                  onUpdate(payload.new);
                }
              } catch (error) {
                logger.error('[Realtime] UPDATE 콜백 에러:', error);
              }
            },
          )
          .subscribe((status, err) => {
            if (!mounted) return;
            if (status === 'CHANNEL_ERROR') {
              logger.warn('[Realtime] 채널 에러:', err);
            }
          });
      } catch (error) {
        logger.error('[Realtime] 구독 설정 실패:', error);
      }
    };

    subscribe();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [onInsert, onDelete, onUpdate, enabled]);
}
