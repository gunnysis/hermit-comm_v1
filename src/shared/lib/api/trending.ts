import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import { APIError } from './error';
import { extractErrorMessage } from './helpers';
import type { TrendingPost } from '@/types';

/**
 * 트렌딩 게시글 조회.
 * DB의 `get_trending_posts` RPC를 호출하여
 * 참여도/시간 가중 점수 기반 인기 글을 반환합니다.
 */
export async function getTrendingPosts(
  hours: number = 72,
  limit: number = 10,
): Promise<TrendingPost[]> {
  const { data, error } = await supabase.rpc('get_trending_posts', {
    p_hours: hours,
    p_limit: limit,
  });

  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] getTrendingPosts 에러:', errorMsg, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new APIError(500, '트렌딩 게시글 조회에 실패했습니다.', error.code, error);
  }

  return (data || []) as TrendingPost[];
}
