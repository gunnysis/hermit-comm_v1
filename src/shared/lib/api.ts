import { supabase } from './supabase';
import { logger } from '@/shared/utils/logger';
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

  get userMessage(): string {
    if (this.status === 401) return '인증이 필요합니다.';
    if (this.status === 403) return '권한이 없습니다.';
    if (this.status === 404) return '요청한 데이터를 찾을 수 없습니다.';
    if (this.status >= 500) return '서버 오류가 발생했습니다.';
    return this.message;
  }
}

export const api = {
  getPosts: async (
    limit: number = 20,
    offset: number = 0,
    sortOrder: 'latest' | 'popular' = 'latest',
  ): Promise<GetPostsResponse> => {
    const table = sortOrder === 'popular' ? 'posts_with_like_count' : 'posts';
    const orderCol = sortOrder === 'popular' ? 'like_count' : 'created_at';

    const query = supabase
      .from(table)
      .select(sortOrder === 'latest' ? '*, comments(count)' : '*')
      .order(orderCol, { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      logger.error('[API] getPosts 에러:', error.message);
      throw new APIError(500, error.message);
    }

    const rows = (data || []) as unknown as (Post & {
      comments?: { count: number }[] | number;
      like_count?: number;
      comment_count?: number;
    })[];

    return rows.map((row) => {
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
  },

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
      logger.error('[API] searchPosts 에러:', error.message);
      throw new APIError(500, error.message);
    }

    const rows = (data || []) as (Post & { comments?: { count: number }[] | number })[];
    return rows.map((row) => {
      const { comments: commentCount, ...rest } = row;
      const comment_count = Array.isArray(commentCount)
        ? commentCount.reduce((sum, c) => sum + (c?.count ?? 0), 0)
        : typeof commentCount === 'number'
          ? commentCount
          : undefined;
      return { ...rest, comment_count } as Post;
    });
  },

  getPost: async (id: number): Promise<GetPostResponse> => {
    const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();

    if (error) {
      throw new APIError(
        error.code === 'PGRST116' ? 404 : 500,
        '게시글을 찾을 수 없습니다.',
        error.code,
        error,
      );
    }

    return data as Post;
  },

  createPost: async (postData: CreatePostRequest): Promise<CreatePostResponse> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new APIError(401, '인증이 필요합니다.');
    }

    const isAnonymous = postData.is_anonymous ?? true;
    const displayName = postData.display_name ?? (isAnonymous ? '익명' : postData.author);

    const insertRow = {
      ...postData,
      is_anonymous: isAnonymous,
      display_name: displayName,
      author_id: user.id,
    };

    const { data, error } = await supabase.from('posts').insert([insertRow]).select().single();

    if (!error) {
      return data as Post;
    }

    if (error.code !== '42501') {
      logger.error('[API] createPost 에러:', error.message);
      throw new APIError(500, '게시글 생성에 실패했습니다.', error.code, error);
    }

    const { error: retryError } = await supabase.from('posts').insert([insertRow]);

    if (retryError) {
      logger.error('[API] createPost 에러:', retryError.message);
      throw new APIError(
        retryError.code === '42501' ? 403 : 500,
        '게시글 생성에 실패했습니다.',
        retryError.code,
        retryError,
      );
    }

    return { ...insertRow, id: 0, created_at: new Date().toISOString() } as unknown as Post;
  },

  deletePost: async (id: number): Promise<void> => {
    const { error } = await supabase.from('posts').delete().eq('id', id);

    if (error) {
      logger.error('[API] deletePost 에러:', error.message);
      throw new APIError(
        error.code === '42501' ? 403 : 500,
        '게시글 삭제에 실패했습니다.',
        error.code,
        error,
      );
    }
  },

  updatePost: async (id: number, body: UpdatePostRequest): Promise<UpdatePostResponse> => {
    const { data, error } = await supabase
      .from('posts')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('[API] updatePost 에러:', error.message);
      throw new APIError(
        error.code === '42501' ? 403 : 500,
        '게시글 수정에 실패했습니다.',
        error.code,
        error,
      );
    }

    return data as Post;
  },

  getComments: async (
    postId: number,
    limit: number = 20,
    offset: number = 0,
  ): Promise<GetCommentsResponse> => {
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
  },

  createComment: async (
    postId: number,
    commentData: CreateCommentRequest,
  ): Promise<CreateCommentResponse> => {
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
  },

  updateComment: async (id: number, body: UpdateCommentRequest): Promise<UpdateCommentResponse> => {
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
  },

  deleteComment: async (id: number): Promise<void> => {
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
  },

  getReactions: async (postId: number): Promise<GetReactionsResponse> => {
    const { data, error } = await supabase
      .from('reactions')
      .select('reaction_type, count')
      .eq('post_id', postId);

    if (error) {
      throw new APIError(500, error.message);
    }

    return (data || []) as Reaction[];
  },

  createReaction: async (
    postId: number,
    reactionData: CreateReactionRequest,
  ): Promise<CreateReactionResponse> => {
    const { reaction_type } = reactionData;

    const { data: existingReaction } = await supabase
      .from('reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('reaction_type', reaction_type)
      .single();

    let result;

    if (existingReaction) {
      const { data, error } = await supabase
        .from('reactions')
        .update({ count: existingReaction.count + 1 })
        .eq('id', existingReaction.id)
        .select('reaction_type, count')
        .single();

      if (error) {
        throw new APIError(500, '반응 업데이트에 실패했습니다.', error.code, error);
      }

      result = data;
    } else {
      const { data, error } = await supabase
        .from('reactions')
        .insert([{ post_id: postId, reaction_type, count: 1 }])
        .select('reaction_type, count')
        .single();

      if (error) {
        throw new APIError(500, '반응 생성에 실패했습니다.', error.code, error);
      }

      result = data;
    }

    return result as Reaction;
  },

  healthCheck: async (): Promise<{ status: string }> => {
    try {
      const { error } = await supabase.from('posts').select('id').limit(1);
      if (error) return { status: 'error' };
      return { status: 'ok' };
    } catch {
      return { status: 'error' };
    }
  },
};
