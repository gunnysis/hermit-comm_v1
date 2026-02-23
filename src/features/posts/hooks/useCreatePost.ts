import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { resolveDisplayName } from '@/shared/lib/anonymous';
import { toFriendlyErrorMessage } from '@/shared/lib/errors';
import { postSchema, type PostFormValues } from '@/shared/lib/schemas';
import type { AnonMode } from '@/types';
import type { CreatePostRequest } from '@/types';

export interface UseCreatePostOptions {
  boardId: number | null;
  groupId?: number | null;
  user?: { id: string } | null;
  anonMode?: AnonMode;
  /** 추가 게시글 데이터 반환 함수 (예: 이미지 URL) */
  getExtraPostData?: () => Partial<CreatePostRequest>;
  /** 성공 시 호출 콜백 (폼 데이터 전달) */
  onSuccess?: (data: PostFormValues) => void | Promise<void>;
  /** 에러 시 호출 콜백 */
  onError?: (message: string) => void;
  /** 기본 폼 값 */
  defaultValues?: Partial<PostFormValues>;
}

/**
 * 게시글 작성 공통 훅.
 * 폼 상태, 익명 처리, API 호출, 캐시 무효화를 담당.
 */
export function useCreatePost({
  boardId,
  groupId,
  user,
  anonMode = 'always_anon',
  getExtraPostData,
  onSuccess,
  onError,
  defaultValues,
}: UseCreatePostOptions) {
  const queryClient = useQueryClient();
  const [showName, setShowName] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { title: '', content: '', author: '', ...defaultValues },
  });

  const handleContentChange = useCallback(
    (html: string) => {
      setValue('content', html);
    },
    [setValue],
  );

  const onSubmit = useCallback(
    async (data: PostFormValues) => {
      if (!boardId) {
        onError?.('게시판 정보를 불러오지 못했습니다.');
        return;
      }

      try {
        const rawAuthor = data.author?.trim() ?? '';
        const { isAnonymous, displayName } = resolveDisplayName({
          anonMode,
          rawAuthorName: rawAuthor,
          userId: user?.id ?? null,
          boardId,
          groupId: groupId ?? null,
          wantNameOverride: showName,
        });

        const extraData = getExtraPostData?.() ?? {};
        await api.createPost({
          title: data.title.trim(),
          content: data.content.trim(),
          author: rawAuthor,
          board_id: boardId,
          group_id: groupId ?? undefined,
          is_anonymous: isAnonymous,
          display_name: displayName,
          ...extraData,
        });

        queryClient.invalidateQueries({ queryKey: ['boardPosts', boardId] });
        if (groupId) {
          queryClient.invalidateQueries({ queryKey: ['groupPosts', groupId, boardId] });
        }

        await onSuccess?.(data);
      } catch (e) {
        onError?.(toFriendlyErrorMessage(e, '게시글 작성에 실패했습니다.'));
      }
    },
    [
      boardId,
      groupId,
      user?.id,
      anonMode,
      showName,
      getExtraPostData,
      queryClient,
      onSuccess,
      onError,
    ],
  );

  return {
    control,
    handleSubmit,
    setValue,
    watch,
    handleContentChange,
    errors,
    isSubmitting,
    showName,
    setShowName,
    onSubmit,
  };
}
