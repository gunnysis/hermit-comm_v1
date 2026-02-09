// API 타입 정의 (api_memo.md 기반)

export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;  // 닉네임 (사용자 입력)
  author_id: string;  // UUID (서버 자동 설정)
  created_at: string;
  /** 목록 조회 시 댓글 수 (선택) */
  comment_count?: number;
}

export interface Comment {
  id: number;
  post_id: number;
  content: string;
  author: string;  // 닉네임 (사용자 입력)
  author_id: string;  // UUID (서버 자동 설정)
  created_at: string;
}

export interface Reaction {
  reaction_type: string;
  count: number;
}

// 요청 타입
export interface CreatePostRequest {
  title: string;
  content: string;
  author: string;
}

export interface CreateCommentRequest {
  content: string;
  author: string;
}

export interface CreateReactionRequest {
  reaction_type: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  author?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// 응답 타입
export type GetPostsResponse = Post[];
export type GetPostResponse = Post;
export type CreatePostResponse = Post;
export type UpdatePostResponse = Post;
export type GetCommentsResponse = Comment[];
export type CreateCommentResponse = Comment;
export type UpdateCommentResponse = Comment;
export type GetReactionsResponse = Reaction[];
export type CreateReactionResponse = Reaction;

// 타입 가드 함수
export function isPost(obj: unknown): obj is Post {
  if (typeof obj !== 'object' || obj === null) return false;
  const post = obj as Partial<Post>;
  return (
    typeof post.id === 'number' &&
    typeof post.title === 'string' &&
    typeof post.content === 'string' &&
    typeof post.author === 'string' &&
    typeof post.author_id === 'string' &&
    typeof post.created_at === 'string'
  );
}

export function isComment(obj: unknown): obj is Comment {
  if (typeof obj !== 'object' || obj === null) return false;
  const comment = obj as Partial<Comment>;
  return (
    typeof comment.id === 'number' &&
    typeof comment.post_id === 'number' &&
    typeof comment.content === 'string' &&
    typeof comment.author === 'string' &&
    typeof comment.author_id === 'string' &&
    typeof comment.created_at === 'string'
  );
}
