import { supabase } from '../supabase';
import { APIError } from './error';
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
    throw new APIError(500, '트렌딩 게시글 조회에 실패했습니다.', error.code, error);
  }

  return (data || []) as TrendingPost[];
}
