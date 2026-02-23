import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import type { PostAnalysis } from '@/types';

// 배포된 Edge Function 이름
const SMART_SERVICE_FUNCTION = 'smart-service';

export async function getEmotionTrend(
  days: number = 7,
): Promise<{ emotion: string; cnt: number }[]> {
  const { data, error } = await supabase.rpc('get_emotion_trend', { days });
  if (error) {
    logger.error('[API] getEmotionTrend 에러:', error.message);
    return [];
  }
  return (data ?? []) as { emotion: string; cnt: number }[];
}

export async function getPostAnalysis(postId: number): Promise<PostAnalysis | null> {
  const { data, error } = await supabase
    .from('post_analysis')
    .select('*')
    .eq('post_id', postId)
    .maybeSingle();

  if (error) {
    logger.error('[API] getPostAnalysis 에러:', error.message);
    return null;
  }
  return data as PostAnalysis | null;
}

/**
 * smart-service Edge Function을 직접 호출하여 게시글 감정 분석을 수동 트리거.
 * 일반적으로는 DB Webhook이 자동 호출하므로 직접 호출은 보조적 용도로 사용.
 * 배포 URL: https://qwrjebpsjjdxhhhllqcw.supabase.co/functions/v1/smart-service
 */
export async function invokeSmartService(postId: number, content: string): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke(SMART_SERVICE_FUNCTION, {
    body: {
      type: 'INSERT',
      table: 'posts',
      schema: 'public',
      record: { id: postId, content },
      old_record: null,
    },
  });

  if (error) {
    logger.error('[API] invokeSmartService 에러:', error.message);
    return [];
  }

  const result = data as { ok: boolean; emotions?: string[]; skipped?: string } | null;
  if (!result?.ok || !result.emotions) {
    return [];
  }
  return result.emotions;
}
