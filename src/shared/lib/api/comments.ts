import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import { APIError } from './error';
import type {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  GetCommentsResponse,
  CreateCommentResponse,
  UpdateCommentResponse,
} from '@/types';

export async function getComments(
  postId: number,
  limit: number = 20,
  offset: number = 0,
): Promise<GetCommentsResponse> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new APIError(500, error.message);
  }

  return (data || []) as Comment[];
}

export async function createComment(
  postId: number,
  commentData: CreateCommentRequest,
): Promise<CreateCommentResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new APIError(401, '인증이 필요합니다.');
  }

  const isAnonymous = commentData.is_anonymous ?? true;
  const displayName = commentData.display_name ?? (isAnonymous ? '익명' : commentData.author);

  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        ...commentData,
        is_anonymous: isAnonymous,
        display_name: displayName,
        post_id: postId,
        author_id: user.id,
      },
    ])
    .select()
    .single();

  if (error) {
    logger.error('[API] createComment 에러:', error.message);
    throw new APIError(
      error.code === '42501' ? 403 : 500,
      '댓글 생성에 실패했습니다.',
      error.code,
      error,
    );
  }

  return data as Comment;
}

export async function updateComment(
  id: number,
  body: UpdateCommentRequest,
): Promise<UpdateCommentResponse> {
  const { data, error } = await supabase
    .from('comments')
    .update({ content: body.content })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new APIError(
      error.code === '42501' ? 403 : 500,
      '댓글 수정에 실패했습니다.',
      error.code,
      error,
    );
  }

  return data as Comment;
}

export async function deleteComment(id: number): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);

  if (error) {
    logger.error('[API] deleteComment 에러:', error.message);
    throw new APIError(
      error.code === '42501' ? 403 : 500,
      '댓글 삭제에 실패했습니다.',
      error.code,
      error,
    );
  }
}
