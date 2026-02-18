import { useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import type { Post } from '@/types';
import { isPost } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * 게시글 실시간 구독 훅
 *
 * @param onInsert - 새 게시글이 추가될 때 호출되는 콜백
 * @param onDelete - 게시글이 삭제될 때 호출되는 콜백
 * @param onUpdate - 게시글이 업데이트될 때 호출되는 콜백
 */
export function useRealtimePosts({
  onInsert,
  onDelete,
  onUpdate,
}: {
  onInsert?: (post: Post) => void;
  onDelete?: (postId: number) => void;
  onUpdate?: (post: Post) => void;
}) {
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let mounted = true;

    const subscribe = async () => {
      try {
        console.log('[Realtime] 게시글 구독 시작');

        channel = supabase
          .channel('posts_changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'posts',
            },
            (payload) => {
              if (!mounted) return;
              console.log('[Realtime] 게시글 추가:', payload.new);
              try {
                if (onInsert && payload.new) {
                  if (isPost(payload.new)) {
                    onInsert(payload.new);
                  } else {
                    console.error('[Realtime] 잘못된 Post 데이터:', payload.new);
                  }
                }
              } catch (error) {
                console.error('[Realtime] INSERT 콜백 에러:', error);
              }
            },
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'posts',
            },
            (payload) => {
              if (!mounted) return;
              console.log('[Realtime] 게시글 삭제:', payload.old);
              try {
                if (onDelete && payload.old) {
                  if (isPost(payload.old)) {
                    onDelete(payload.old.id);
                  } else if (typeof (payload.old as { id?: number }).id === 'number') {
                    // 필드가 id만 있는 경우도 삭제 처리 대상
                    onDelete((payload.old as { id: number }).id);
                  } else {
                    console.error('[Realtime] 잘못된 Post 데이터:', payload.old);
                  }
                }
              } catch (error) {
                console.error('[Realtime] DELETE 콜백 에러:', error);
              }
            },
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'posts',
            },
            (payload) => {
              if (!mounted) return;
              console.log('[Realtime] 게시글 업데이트:', payload.new);
              try {
                if (onUpdate && payload.new) {
                  if (isPost(payload.new)) {
                    onUpdate(payload.new);
                  } else {
                    console.error('[Realtime] 잘못된 Post 데이터:', payload.new);
                  }
                }
              } catch (error) {
                console.error('[Realtime] UPDATE 콜백 에러:', error);
              }
            },
          )
          .subscribe((status, err) => {
            if (!mounted) return;

            console.log('[Realtime] 구독 상태:', status);

            if (status === 'CHANNEL_ERROR') {
              console.error('[Realtime] 채널 에러:', err);
            } else if (status === 'TIMED_OUT') {
              console.error('[Realtime] 타임아웃');
            } else if (status === 'CLOSED') {
              console.warn('[Realtime] 채널 닫힘');
            }
          });
      } catch (error) {
        console.error('[Realtime] 구독 설정 실패:', error);
      }
    };

    subscribe();

    // 클린업: 컴포넌트 언마운트 시 구독 해제
    return () => {
      mounted = false;
      if (channel) {
        console.log('[Realtime] 게시글 구독 해제');
        supabase.removeChannel(channel).catch((err) => {
          console.error('[Realtime] 채널 제거 실패:', err);
        });
      }
    };
  }, [onInsert, onDelete, onUpdate]);
}
