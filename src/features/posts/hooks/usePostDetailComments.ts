import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { useRealtimeComments } from '@/features/comments/hooks/useRealtimeComments';
import { resolveDisplayName, type AnonMode } from '@/shared/lib/anonymous';
import { toFriendlyErrorMessage } from '@/shared/lib/errors';
import { validateCommentContent } from '@/shared/utils/validate';
import type { Comment } from '@/types';
import type { Post } from '@/types';

interface UsePostDetailCommentsOptions {
  postId: number;
  post: Post | null | undefined;
  anonMode: AnonMode;
  savedAuthor: string;
  user: { id: string } | null | undefined;
}

/**
 * 게시글 댓글 쿼리 + 실시간 구독 + 작성/수정/삭제 핸들러.
 * 댓글 작성/삭제 시 boardPosts·groupPosts 무효화.
 */
export function usePostDetailComments({
  postId,
  post,
  anonMode,
  savedAuthor,
  user,
}: UsePostDetailCommentsOptions) {
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const {
    data: comments = [],
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => api.getComments(postId),
    enabled: postId > 0,
  });

  const invalidateListQueries = useCallback(() => {
    if (!post?.board_id) return;
    queryClient.invalidateQueries({ queryKey: ['boardPosts', post.board_id] });
    if (post.group_id) {
      queryClient.invalidateQueries({ queryKey: ['groupPosts', post.group_id, post.board_id] });
    }
  }, [post?.board_id, post?.group_id, queryClient]);

  useRealtimeComments({
    postId,
    onInsert: useCallback(
      (newComment: Comment) => {
        queryClient.setQueryData<Comment[]>(['comments', postId], (old) =>
          old?.some((c) => c.id === newComment.id) ? old : [...(old ?? []), newComment],
        );
      },
      [queryClient, postId],
    ),
    onDelete: useCallback(
      (commentId: number) => {
        queryClient.setQueryData<Comment[]>(
          ['comments', postId],
          (old) => old?.filter((c) => c.id !== commentId) ?? [],
        );
      },
      [queryClient, postId],
    ),
  });

  const handleSubmitComment = useCallback(
    async (onSuccess?: () => void) => {
      const validation = validateCommentContent(commentContent);
      if (!validation.isValid) {
        return { error: validation.error };
      }

      try {
        setCommentLoading(true);
        const rawAuthor = savedAuthor ?? '';

        const { isAnonymous, displayName } = resolveDisplayName({
          anonMode,
          rawAuthorName: rawAuthor,
          userId: user?.id ?? null,
          boardId: post?.board_id ?? null,
          groupId: post?.group_id ?? null,
          wantNameOverride: false,
        });

        await api.createComment(postId, {
          content: commentContent.trim(),
          author: rawAuthor || '익명',
          board_id: post?.board_id,
          group_id: post?.group_id,
          is_anonymous: isAnonymous,
          display_name: displayName,
        });

        setCommentContent('');
        await refetchComments();
        invalidateListQueries();
        onSuccess?.();
        return;
      } catch (e) {
        return {
          error: toFriendlyErrorMessage(e, '댓글 작성에 실패했습니다.'),
        };
      } finally {
        setCommentLoading(false);
      }
    },
    [
      commentContent,
      savedAuthor,
      user?.id,
      post?.board_id,
      post?.group_id,
      anonMode,
      postId,
      refetchComments,
      invalidateListQueries,
    ],
  );

  const handleEditComment = useCallback(
    async (commentId: number, content: string) => {
      try {
        await api.updateComment(commentId, { content });
        queryClient.setQueryData<Comment[]>(
          ['comments', postId],
          (old) => old?.map((c) => (c.id === commentId ? { ...c, content } : c)) ?? [],
        );
      } catch (e) {
        throw new Error(toFriendlyErrorMessage(e, '댓글 수정에 실패했습니다.'));
      }
    },
    [postId, queryClient],
  );

  const handleDeleteComment = useCallback(
    async (commentId: number): Promise<{ error?: string } | void> => {
      try {
        await api.deleteComment(commentId);
        await refetchComments();
        invalidateListQueries();
      } catch (e) {
        return {
          error: toFriendlyErrorMessage(e, '댓글 삭제에 실패했습니다.'),
        };
      }
    },
    [refetchComments, invalidateListQueries],
  );

  return {
    comments,
    commentsLoading,
    refetchComments,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    commentContent,
    setCommentContent,
    commentLoading,
    setCommentLoading,
  };
}
