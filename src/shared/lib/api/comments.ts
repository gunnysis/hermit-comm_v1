import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import { addBreadcrumb } from '@/shared/utils/sentryBreadcrumb';
import { APIError } from './error';
import { extractErrorMessage } from './helpers';
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
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] getComments 에러:', errorMsg, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new APIError(500, errorMsg);
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
  const displayName = commentData.display_name ?? '익명';

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
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] createComment 에러:', errorMsg, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new APIError(
      error.code === '42501' ? 403 : 500,
      '댓글 생성에 실패했습니다.',
      error.code,
      error,
    );
  }

  addBreadcrumb('comment', 'createComment', { postId, commentId: data.id });
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
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] updateComment 에러:', errorMsg, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
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
  const { error } = await supabase.rpc('soft_delete_comment', {
    p_comment_id: id,
  });

  if (error) {
    logger.error('[API] deleteComment 에러:', error.message);
    throw new APIError(
      error.code === '42501' ? 403 : 500,
      '댓글 삭제에 실패했습니다.',
      error.code,
      error,
    );
  }
  addBreadcrumb('comment', 'deleteComment', { commentId: id });
}
