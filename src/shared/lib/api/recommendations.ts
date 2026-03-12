import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import { APIError } from './error';
import { extractErrorMessage } from './helpers';
import type { RecommendedPost } from '@/types';

/**
 * 감정 기반 추천 게시글 조회.
 * DB의 `get_recommended_posts_by_emotion` RPC를 호출하여
 * 현재 게시글과 유사한 감정의 글을 반환합니다.
 */
export async function getRecommendedPosts(
  postId: number,
  limit: number = 5,
): Promise<RecommendedPost[]> {
  const { data, error } = await supabase.rpc('get_recommended_posts_by_emotion', {
    p_post_id: postId,
    p_limit: limit,
  });

  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] getRecommendedPosts 에러:', errorMsg, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new APIError(500, '추천 게시글 조회에 실패했습니다.', error.code, error);
  }

  return (data || []) as RecommendedPost[];
}
