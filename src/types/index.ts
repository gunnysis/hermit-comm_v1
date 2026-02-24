// API 타입 정의 (api_memo.md 기반)

/** 게시판 익명 모드 */
export type AnonMode = 'always_anon' | 'allow_choice' | 'require_name';

/** 감정 분석 상태 */
export type AnalysisStatus = 'pending' | 'completed' | 'failed' | 'skipped';

export interface Board {
  id: number;
  name: string;
  description?: string | null;
  visibility: 'public' | 'private';
  anon_mode: AnonMode;
  /** 그룹 전용 게시판일 때 설정 (007 마이그레이션) */
  group_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author: string; // 닉네임 (사용자 입력)
  author_id: string; // UUID (서버 자동 설정)
  created_at: string;
  /** 게시판/그룹 기반 익명 게시판용 */
  board_id?: number;
  group_id?: number;
  is_anonymous: boolean;
  display_name: string;
  /** 목록 조회 시 댓글 수 (선택) */
  comment_count?: number;
  /** 감정 분석 결과 (posts_with_like_count 뷰 또는 post_analysis JOIN) */
  emotions?: string[];
  /** 첨부 이미지 URL */
  image_url?: string | null;
}

export interface PostAnalysis {
  id: number;
  post_id: number;
  emotions: string[];
  analyzed_at: string;
  /** 분석 상태 (DB 컬럼이 없는 경우 undefined) */
  status?: AnalysisStatus;
  /** 분석 신뢰도 0~1 (DB 컬럼이 없는 경우 undefined) */
  confidence?: number;
}

export interface Comment {
  id: number;
  post_id: number;
  content: string;
  author: string; // 닉네임 (사용자 입력)
  author_id: string; // UUID (서버 자동 설정)
  created_at: string;
  /** 게시판/그룹 기반 익명 게시판용 */
  board_id?: number;
  group_id?: number;
  is_anonymous: boolean;
  display_name: string;
}

export interface Reaction {
  reaction_type: string;
  count: number;
}

export interface ToggleReactionResponse {
  reacted: boolean;
  reaction_type: string;
}

/** 감정 기반 추천 게시글 (get_recommended_posts_by_emotion RPC 반환 타입) */
export interface RecommendedPost {
  id: number;
  title: string;
  board_id: number;
  like_count: number;
  comment_count: number;
  emotions: string[];
  created_at: string;
}

// 요청 타입
export interface CreatePostRequest {
  title: string;
  content: string;
  author: string;
  /** 선택: 특정 게시판/그룹 지정 */
  board_id?: number;
  group_id?: number;
  /** 선택: 클라이언트에서 직접 익명 여부/표시 이름을 정하고 싶을 때 */
  is_anonymous?: boolean;
  display_name?: string;
  /** 선택: 첨부 이미지 URL (Supabase Storage 등) */
  image_url?: string | null;
}

export interface CreateCommentRequest {
  content: string;
  author: string;
  board_id?: number;
  group_id?: number;
  is_anonymous?: boolean;
  display_name?: string;
}

export interface CreateReactionRequest {
  reaction_type: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  author?: string;
  image_url?: string | null;
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
    typeof post.created_at === 'string' &&
    typeof post.is_anonymous === 'boolean' &&
    typeof post.display_name === 'string'
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
    typeof comment.created_at === 'string' &&
    typeof comment.is_anonymous === 'boolean' &&
    typeof comment.display_name === 'string'
  );
}
