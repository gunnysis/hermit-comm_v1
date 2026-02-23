import { z } from 'zod';
import { VALIDATION } from './constants';

/** 글 작성/수정 검증 */
export const postSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요.')
    .max(VALIDATION.POST_TITLE_MAX, `제목은 ${VALIDATION.POST_TITLE_MAX}자 이내로 입력해주세요.`),
  content: z
    .string()
    .min(1, '내용을 입력해주세요.')
    .max(
      VALIDATION.POST_CONTENT_MAX,
      `내용은 ${VALIDATION.POST_CONTENT_MAX}자 이내로 입력해주세요.`,
    ),
  author: z
    .string()
    .max(VALIDATION.AUTHOR_MAX, `작성자 이름은 ${VALIDATION.AUTHOR_MAX}자 이내로 입력해주세요.`)
    .optional(),
});

/** 댓글 작성 검증 */
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력해주세요.')
    .max(VALIDATION.COMMENT_MAX, `댓글은 ${VALIDATION.COMMENT_MAX}자 이내로 입력해주세요.`),
});

/** 검색 입력 검증 */
export const searchSchema = z.object({
  query: z.string().max(200, '검색어는 200자 이내로 입력해주세요.').optional().default(''),
});

export type PostFormValues = z.infer<typeof postSchema>;
export type CommentFormValues = z.infer<typeof commentSchema>;
export type SearchFormValues = z.infer<typeof searchSchema>;
