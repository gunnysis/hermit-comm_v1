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
    const errorMsg = error.message || error.code || 'unknown_supabase_error';
    logger.error('[API] getEmotionTrend 에러:', errorMsg, {
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
    const errorMsg = error.message || error.code || 'unknown_supabase_error';
    logger.error('[API] getPostAnalysis 에러:', errorMsg, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }
  return data as PostAnalysis | null;
}

/** 세션 확인 후 필요 시 갱신. 유효한 세션이 있으면 true. */
async function ensureValidSession(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return true;

  const { error } = await supabase.auth.refreshSession();
  return !error;
}

/**
 * analyze-post-on-demand Edge Function을 직접 호출하여 게시글 감정 분석을 수동 트리거.
 * DB Webhook 실패·지연 시 fallback으로 사용.
 *
 * JWT 만료 시 세션 갱신 후 1회 재시도.
 */
export async function invokeSmartService(
  postId: number,
  content: string,
  title?: string,
): Promise<{ emotions: string[]; error?: string; retryable?: boolean }> {
  // 세션 확인: JWT 만료 시 갱신 시도
  const hasSession = await ensureValidSession();
  if (!hasSession) {
    return { emotions: [], error: 'session_expired', retryable: false };
  }

  const { data, error } = await supabase.functions.invoke(SMART_SERVICE_FUNCTION, {
    body: { postId, content, title },
  });

  if (error) {
    let errorMessage: string;
    let statusCode: number | undefined;
    try {
      if ('context' in error && error.context instanceof Response) {
        statusCode = error.context.status;
        const body = await error.context.json();
        errorMessage = body?.reason || body?.message || error.message;
      } else {
        errorMessage = error.message ?? String(error);
      }
    } catch {
      errorMessage = error.message ?? 'Unknown edge function error';
    }

    // JWT 만료(401) 시 세션 갱신 후 1회 재시도
    if (statusCode === 401) {
      const refreshed = await ensureValidSession();
      if (refreshed) {
        const retry = await supabase.functions.invoke(SMART_SERVICE_FUNCTION, {
          body: { postId, content, title },
        });
        if (!retry.error) {
          const result = retry.data as {
            ok: boolean;
            emotions?: string[];
            reason?: string;
            retryable?: boolean;
          } | null;
          if (result?.ok && result.emotions) return { emotions: result.emotions };
          if (result && !result.ok)
            return {
              emotions: [],
              error: result.reason ?? 'unknown',
              retryable: result.retryable ?? false,
            };
          return { emotions: [] };
        }
      }
      return { emotions: [], error: 'jwt_refresh_failed', retryable: false };
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
