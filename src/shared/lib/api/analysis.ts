import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import type { PostAnalysis } from '@/types';

// 배포된 Edge Function 이름 (수동/fallback 감정 분석).
// 권장: analyze-post-on-demand. smart-service만 배포된 경우 'smart-service'로 변경.
const SMART_SERVICE_FUNCTION = 'analyze-post-on-demand';

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
 * DB Webhook 실패·지연 시 fallback으로 사용. 앱에서 14초 후 자동 호출됨.
 */
export async function invokeSmartService(
  postId: number,
  content: string,
  title?: string,
): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke(SMART_SERVICE_FUNCTION, {
    body: { postId, content, title },
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
