import { useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * 반응(reactions) 실시간 구독 훅
 * post_id 기준으로 INSERT/UPDATE/DELETE 시 onReactionsChange 호출.
 * 상세 화면에서 refetchReactions 등을 호출해 UI 갱신.
 */
export function useRealtimeReactions({
  postId,
  onReactionsChange,
}: {
  postId: number;
  onReactionsChange?: () => void;
}) {
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let mounted = true;

    const subscribe = () => {
      try {
        channel = supabase
          .channel(`reactions_${postId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'reactions',
              filter: `post_id=eq.${postId}`,
            },
            () => {
              if (mounted && onReactionsChange) onReactionsChange();
            },
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'reactions',
              filter: `post_id=eq.${postId}`,
            },
            () => {
              if (mounted && onReactionsChange) onReactionsChange();
            },
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'reactions',
              filter: `post_id=eq.${postId}`,
            },
            () => {
              if (mounted && onReactionsChange) onReactionsChange();
            },
          )
          .subscribe();
      } catch (e) {
        console.error('[Realtime] 반응 구독 실패:', e);
      }
    };

    subscribe();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [postId, onReactionsChange]);
}
