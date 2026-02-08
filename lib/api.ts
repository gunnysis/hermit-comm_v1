import { supabase } from './supabase';
import type {
  Post,
  Comment,
  Reaction,
  CreatePostRequest,
  CreateCommentRequest,
  CreateReactionRequest,
  GetPostsResponse,
  GetPostResponse,
  CreatePostResponse,
  GetCommentsResponse,
  CreateCommentResponse,
  GetReactionsResponse,
  CreateReactionResponse,
} from '../types';

class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }

  // 사용자 친화적 메시지
  get userMessage(): string {
    if (this.status === 401) return '인증이 필요합니다.';
    if (this.status === 403) return '권한이 없습니다.';
    if (this.status === 404) return '요청한 데이터를 찾을 수 없습니다.';
    if (this.status >= 500) return '서버 오류가 발생했습니다.';
    return this.message;
  }
}

// Supabase 기반 API 클라이언트
export const api = {
  // 게시글 목록 조회
  getPosts: async (limit: number = 20, offset: number = 0): Promise<GetPostsResponse> => {
    console.log('[Supabase] 게시글 목록 조회:', { limit, offset });
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(500, error.message);
    }

    console.log('[Supabase] 게시글 개수:', data?.length);
    return (data || []) as Post[];
  },

  // 게시글 단건 조회
  getPost: async (id: number): Promise<GetPostResponse> => {
    console.log('[Supabase] 게시글 조회:', id);
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(
        error.code === 'PGRST116' ? 404 : 500,
        '게시글을 찾을 수 없습니다.',
        error.code,
        error
      );
    }

    return data as Post;
  },

  // 게시글 생성
  createPost: async (postData: CreatePostRequest): Promise<CreatePostResponse> => {
    console.log('[Supabase] 게시글 생성:', postData);
    
    // 현재 인증된 사용자의 UUID 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new APIError(401, '인증이 필요합니다.');
    }
    
    // author_id를 명시적으로 설정
    const { data, error } = await supabase
      .from('posts')
      .insert([{ ...postData, author_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(
        error.code === '42501' ? 403 : 500,
        '게시글 생성에 실패했습니다.',
        error.code,
        error
      );
    }

    console.log('[Supabase] 게시글 생성 완료:', data.id);
    return data as Post;
  },

  // 게시글 삭제
  deletePost: async (id: number): Promise<void> => {
    console.log('[Supabase] 게시글 삭제:', id);
    
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(
        error.code === '42501' ? 403 : 500,
        '게시글 삭제에 실패했습니다.',
        error.code,
        error
      );
    }

    console.log('[Supabase] 게시글 삭제 완료');
  },

  // 댓글 목록 조회
  getComments: async (
    postId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<GetCommentsResponse> => {
    console.log('[Supabase] 댓글 목록 조회:', { postId, limit, offset });
    
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(500, error.message);
    }

    console.log('[Supabase] 댓글 개수:', data?.length);
    return (data || []) as Comment[];
  },

  // 댓글 생성
  createComment: async (
    postId: number,
    commentData: CreateCommentRequest
  ): Promise<CreateCommentResponse> => {
    console.log('[Supabase] 댓글 생성:', { postId, commentData });
    
    // 현재 인증된 사용자의 UUID 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new APIError(401, '인증이 필요합니다.');
    }
    
    // author_id를 명시적으로 설정
    const { data, error } = await supabase
      .from('comments')
      .insert([{ ...commentData, post_id: postId, author_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(
        error.code === '42501' ? 403 : 500,
        '댓글 생성에 실패했습니다.',
        error.code,
        error
      );
    }

    console.log('[Supabase] 댓글 생성 완료:', data.id);
    return data as Comment;
  },

  // 댓글 삭제
  deleteComment: async (id: number): Promise<void> => {
    console.log('[Supabase] 댓글 삭제:', id);
    
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(
        error.code === '42501' ? 403 : 500,
        '댓글 삭제에 실패했습니다.',
        error.code,
        error
      );
    }

    console.log('[Supabase] 댓글 삭제 완료');
  },

  // 반응 목록 조회
  getReactions: async (postId: number): Promise<GetReactionsResponse> => {
    console.log('[Supabase] 반응 목록 조회:', postId);
    
    const { data, error } = await supabase
      .from('reactions')
      .select('reaction_type, count')
      .eq('post_id', postId);

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(500, error.message);
    }

    console.log('[Supabase] 반응 개수:', data?.length);
    return (data || []) as Reaction[];
  },

  // 반응 추가
  createReaction: async (
    postId: number,
    reactionData: CreateReactionRequest
  ): Promise<CreateReactionResponse> => {
    console.log('[Supabase] 반응 추가:', { postId, reactionData });
    
    const { reaction_type } = reactionData;

    // 1. 기존 반응 확인
    const { data: existingReaction } = await supabase
      .from('reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('reaction_type', reaction_type)
      .single();

    let result;

    if (existingReaction) {
      // 2. 기존 반응이 있으면 count 증가
      const { data, error } = await supabase
        .from('reactions')
        .update({ count: existingReaction.count + 1 })
        .eq('id', existingReaction.id)
        .select('reaction_type, count')
        .single();

      if (error) {
        console.error('[Supabase] 에러:', error);
        throw new APIError(
          500,
          '반응 업데이트에 실패했습니다.',
          error.code,
          error
        );
      }

      result = data;
    } else {
      // 3. 새로운 반응 생성
      const { data, error } = await supabase
        .from('reactions')
        .insert([{ post_id: postId, reaction_type, count: 1 }])
        .select('reaction_type, count')
        .single();

      if (error) {
        console.error('[Supabase] 에러:', error);
        throw new APIError(
          500,
          '반응 생성에 실패했습니다.',
          error.code,
          error
        );
      }

      result = data;
    }

    console.log('[Supabase] 반응 처리 완료:', result);
    return result as Reaction;
  },

  // 헬스 체크 (Supabase 연결 확인)
  healthCheck: async (): Promise<{ status: string }> => {
    console.log('[Supabase] 헬스 체크');
    
    try {
      const { error } = await supabase.from('posts').select('id').limit(1);
      
      if (error) {
        console.error('[Supabase] 연결 실패:', error);
        return { status: 'error' };
      }

      console.log('[Supabase] 연결 성공');
      return { status: 'ok' };
    } catch (error) {
      console.error('[Supabase] 헬스 체크 실패:', error);
      return { status: 'error' };
    }
  },
};
