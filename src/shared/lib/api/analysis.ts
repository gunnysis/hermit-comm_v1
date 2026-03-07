import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import type { PostAnalysis } from '@/types';

// 배포된 Edge Function 이름 (수동/fallback 감정 분석)
const SMART_SERVICE_FUNCTION = 'analyze-post-on-demand';

export async function getEmotionTrend(
  days: number = 7,
): Promise<{ emotion: string; cnt: number; pct: number }[]> {
  const { data, error } = await supabase.rpc('get_emotion_trend', { days });
  if (error) {
    logger.error('[API] getEmotionTrend 에러:', error.message, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }
  return (data ?? []) as { emotion: string; cnt: number; pct: number }[];
}

export async function getPostAnalysis(postId: number): Promise<PostAnalysis | null> {
  const { data, error } = await supabase
    .from('post_analysis')
    .select(
      'id, post_id, emotions, analyzed_at, status, retry_count, error_reason, last_attempted_at',
    )
    .eq('post_id', postId)
    .maybeSingle();

  if (error) {
    logger.error('[API] getPostAnalysis 에러:', error.message, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }
  return data as PostAnalysis | null;
}

/**
 * analyze-post-on-demand Edge Function을 직접 호출하여 게시글 감정 분석을 수동 트리거.
 * DB Webhook 실패·지연 시 fallback으로 사용. 앱에서 10초 후 자동 호출됨.
 */
export async function invokeSmartService(
  postId: number,
  content: string,
  title?: string,
): Promise<{ emotions: string[]; error?: string; retryable?: boolean }> {
  const { data, error } = await supabase.functions.invoke(SMART_SERVICE_FUNCTION, {
    body: { postId, content, title },
  });

  if (error) {
    let errorMessage: string;
    try {
      if ('context' in error && error.context instanceof Response) {
        const body = await error.context.json();
        errorMessage = body?.reason || body?.message || error.message;
      } else {
        errorMessage = error.message ?? String(error);
      }
    } catch {
      errorMessage = error.message ?? 'Unknown edge function error';
    }

    logger.error('[API] invokeSmartService 에러:', errorMessage, { postId });
    return { emotions: [], error: errorMessage };
  }

  const result = data as {
    ok: boolean;
    emotions?: string[];
    skipped?: string;
    reason?: string;
    retryable?: boolean;
  } | null;

  if (!result) {
    return { emotions: [], error: 'empty_response' };
  }

  if (!result.ok) {
    return {
      emotions: [],
      error: result.reason ?? 'unknown',
      retryable: result.retryable ?? false,
    };
  }

  if (result.emotions) return { emotions: result.emotions };
  return { emotions: [] };
}
