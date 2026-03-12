import { supabase } from '@/shared/lib/supabase';
import { APIError } from '@/shared/lib/api/error';
import { logger } from '@/shared/utils/logger';
import type { Board, Post } from '@/types';

export type BoardSortOrder = 'latest' | 'popular';

export interface GetBoardPostsOptions {
  limit?: number;
  offset?: number;
  sortOrder?: BoardSortOrder;
}

export async function getBoards(): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('id', { ascending: true });
  if (error) {
    logger.error('[API] boards 조회 에러:', error.message);
    throw new APIError(500, error.message, error.code, error);
  }
  return (data || []) as Board[];
}

export async function getBoardPosts(
  boardId: number,
  options: GetBoardPostsOptions = {},
): Promise<Post[]> {
  const { limit = 20, offset = 0, sortOrder = 'latest' } = options;

  const orderCol = sortOrder === 'popular' ? 'like_count' : 'created_at';
  const { data, error } = await supabase
    .from('posts_with_like_count')
    .select('*')
    .eq('board_id', boardId)
    .order(orderCol, { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('[API] board posts 조회 에러:', error.message);
    throw new APIError(500, error.message, error.code, error);
  }

  return (data || []) as Post[];
}
