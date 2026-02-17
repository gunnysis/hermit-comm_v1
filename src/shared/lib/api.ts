import { supabase } from './supabase';
import type {
  Post,
  Comment,
  Reaction,
  CreatePostRequest,
  CreateCommentRequest,
  CreateReactionRequest,
  UpdatePostRequest,
  UpdateCommentRequest,
  GetPostsResponse,
  GetPostResponse,
  CreatePostResponse,
  UpdatePostResponse,
  GetCommentsResponse,
  CreateCommentResponse,
  UpdateCommentResponse,
  GetReactionsResponse,
  CreateReactionResponse,
} from '@/types';

class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
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
  // 게시글 목록 조회 (정렬: latest | popular, 댓글 수 포함)
  getPosts: async (
    limit: number = 20,
    offset: number = 0,
    sortOrder: 'latest' | 'popular' = 'latest',
  ): Promise<GetPostsResponse> => {
    console.log('[Supabase] 게시글 목록 조회:', { limit, offset, sortOrder });

    const table = sortOrder === 'popular' ? 'posts_with_like_count' : 'posts';
    const orderCol = sortOrder === 'popular' ? 'like_count' : 'created_at';
    const ascending = sortOrder === 'popular' ? false : false;

    const query = supabase
      .from(table)
      .select(sortOrder === 'latest' ? '*, comments(count)' : '*')
      .order(orderCol, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(500, error.message);
    }

    const rows = (data || []) as unknown as (Post & {
      comments?: { count: number }[] | number;
      like_count?: number;
      comment_count?: number;
    })[];
    const posts: Post[] = rows.map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- like_count intentionally unused when mapping
      const {
        comments: commentCount,
        like_count: _lc,
        comment_count: viewCommentCount,
        ...rest
      } = row;
      const comment_count =
        viewCommentCount !== undefined
          ? viewCommentCount
          : Array.isArray(commentCount)
            ? commentCount.reduce((sum, c) => sum + (c?.count ?? 0), 0)
            : typeof commentCount === 'number'
              ? commentCount
              : undefined;
      return { ...rest, comment_count } as Post;
    });

    console.log('[Supabase] 게시글 개수:', posts.length);
    return posts;
  },

  // 게시글 검색 (제목·내용 ilike)
  searchPosts: async (
    query: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<GetPostsResponse> => {
    const q = query.trim();
    if (!q) return [];

    const escaped = q.replace(/'/g, "''");
    const { data, error } = await supabase
      .from('posts')
      .select('*, comments(count)')
      .or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Supabase] 검색 에러:', error);
      throw new APIError(500, error.message);
    }

    const rows = (data || []) as (Post & { comments?: { count: number }[] | number })[];
    const posts: Post[] = rows.map((row) => {
      const { comments: commentCount, ...rest } = row;
      const comment_count = Array.isArray(commentCount)
        ? commentCount.reduce((sum, c) => sum + (c?.count ?? 0), 0)
        : typeof commentCount === 'number'
          ? commentCount
          : undefined;
      return { ...rest, comment_count } as Post;
    });
    return posts;
  },

  // 게시글 단건 조회
  getPost: async (id: number): Promise<GetPostResponse> => {
    console.log('[Supabase] 게시글 조회:', id);

    const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(
        error.code === 'PGRST116' ? 404 : 500,
        '게시글을 찾을 수 없습니다.',
        error.code,
        error,
      );
    }

    return data as Post;
  },

  // 게시글 생성
  createPost: async (postData: CreatePostRequest): Promise<CreatePostResponse> => {
    console.log('[Supabase] 게시글 생성:', postData);

    // 현재 인증된 사용자의 UUID 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new APIError(401, '인증이 필요합니다.');
    }

    // author_id 및 익명 표시 이름 계산
    const isAnonymous = postData.is_anonymous ?? true;
    const displayName = postData.display_name ?? (isAnonymous ? '익명' : postData.author);

    const { data, error } = await supabase
      .from('posts')
      .insert([{ ...postData, is_anonymous: isAnonymous, display_name: displayName, author_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(
        error.code === '42501' ? 403 : 500,
        '게시글 생성에 실패했습니다.',
        error.code,
        error,
      );
    }

    console.log('[Supabase] 게시글 생성 완료:', data.id);
    return data as Post;
  },

  // 게시글 삭제
  deletePost: async (id: number): Promise<void> => {
    console.log('[Supabase] 게시글 삭제:', id);

    const { error } = await supabase.from('posts').delete().eq('id', id);

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(
        error.code === '42501' ? 403 : 500,
        '게시글 삭제에 실패했습니다.',
        error.code,
        error,
      );
    }

    console.log('[Supabase] 게시글 삭제 완료');
  },

  // 게시글 수정
  updatePost: async (id: number, body: UpdatePostRequest): Promise<UpdatePostResponse> => {
    console.log('[Supabase] 게시글 수정:', id, body);

    const { data, error } = await supabase
      .from('posts')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(
        error.code === '42501' ? 403 : 500,
        '게시글 수정에 실패했습니다.',
        error.code,
        error,
      );
    }

    return data as Post;
  },

  // 댓글 목록 조회
  getComments: async (
    postId: number,
    limit: number = 20,
    offset: number = 0,
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
    commentData: CreateCommentRequest,
  ): Promise<CreateCommentResponse> => {
    console.log('[Supabase] 댓글 생성:', { postId, commentData });

    // 현재 인증된 사용자의 UUID 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new APIError(401, '인증이 필요합니다.');
    }

    // author_id 및 익명 표시 이름 계산
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
      console.error('[Supabase] 에러:', error);
      throw new APIError(
        error.code === '42501' ? 403 : 500,
        '댓글 생성에 실패했습니다.',
        error.code,
        error,
      );
    }

    console.log('[Supabase] 댓글 생성 완료:', data.id);
    return data as Comment;
  },

  // 댓글 수정
  updateComment: async (id: number, body: UpdateCommentRequest): Promise<UpdateCommentResponse> => {
    console.log('[Supabase] 댓글 수정:', id);

    const { data, error } = await supabase
      .from('comments')
      .update({ content: body.content })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(
        error.code === '42501' ? 403 : 500,
        '댓글 수정에 실패했습니다.',
        error.code,
        error,
      );
    }

    return data as Comment;
  },

  // 댓글 삭제
  deleteComment: async (id: number): Promise<void> => {
    console.log('[Supabase] 댓글 삭제:', id);

    const { error } = await supabase.from('comments').delete().eq('id', id);

    if (error) {
      console.error('[Supabase] 에러:', error);
      throw new APIError(
        error.code === '42501' ? 403 : 500,
        '댓글 삭제에 실패했습니다.',
        error.code,
        error,
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
    reactionData: CreateReactionRequest,
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
        throw new APIError(500, '반응 업데이트에 실패했습니다.', error.code, error);
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
        throw new APIError(500, '반응 생성에 실패했습니다.', error.code, error);
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
