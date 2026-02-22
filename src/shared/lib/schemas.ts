import { z } from 'zod';

/** 글 작성/수정 검증 */
export const postSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(100, '제목은 100자 이내로 입력해주세요.'),
  content: z
    .string()
    .min(1, '내용을 입력해주세요.')
    .max(5000, '내용은 5000자 이내로 입력해주세요.'),
  author: z.string().max(50, '작성자 이름은 50자 이내로 입력해주세요.').optional(),
});

/** 댓글 작성 검증 */
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력해주세요.')
    .max(1000, '댓글은 1000자 이내로 입력해주세요.'),
});

/** 검색 입력 검증 */
export const searchSchema = z.object({
  query: z.string().max(200, '검색어는 200자 이내로 입력해주세요.').optional().default(''),
});

export type PostFormValues = z.infer<typeof postSchema>;
export type CommentFormValues = z.infer<typeof commentSchema>;
export type SearchFormValues = z.infer<typeof searchSchema>;
