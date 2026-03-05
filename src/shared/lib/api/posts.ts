import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import { addBreadcrumb } from '@/shared/utils/sentryBreadcrumb';
import { APIError } from './error';
import type {
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  GetPostsResponse,
  GetPostResponse,
  CreatePostResponse,
  UpdatePostResponse,
  SearchResult,
} from '@/types';

export async function getPosts(
  limit: number = 20,
  offset: number = 0,
  sortOrder: 'latest' | 'popular' = 'latest',
): Promise<GetPostsResponse> {
  const { data, error } =
    sortOrder === 'popular'
      ? await supabase
          .from('posts_with_like_count')
          .select('*')
          .order('like_count', { ascending: false })
          .range(offset, offset + limit - 1)
      : await supabase
          .from('posts')
          .select('*, comments(count)')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

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
      like_count: likeCount,
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
    return {
      ...rest,
      comment_count,
      ...(likeCount !== undefined && { like_count: likeCount }),
    } as Post;
  });
}

export async function searchPosts(
  query: string,
  limit: number = 20,
  offset: number = 0,
): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const { data, error } = await supabase.rpc('search_posts', {
    p_query: q,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    logger.error('[API] searchPosts 에러:', error.message);
    throw new APIError(500, error.message);
  }

  return (data ?? []) as SearchResult[];
}

export async function getPost(id: number): Promise<GetPostResponse> {
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
}

export async function createPost(postData: CreatePostRequest): Promise<CreatePostResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new APIError(401, '인증이 필요합니다.');
  }

  const isAnonymous = postData.is_anonymous ?? true;
  const displayName = postData.display_name ?? '익명';

  const insertRow = {
    ...postData,
    is_anonymous: isAnonymous,
    display_name: displayName,
    author_id: user.id,
  };

  const { data, error } = await supabase.from('posts').insert([insertRow]).select().single();

  if (!error) {
    addBreadcrumb('post', '게시글 작성 성공', { board_id: postData.board_id });
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

  addBreadcrumb('post', '게시글 작성 성공', { board_id: postData.board_id });
  return { ...insertRow, id: 0, created_at: new Date().toISOString() } as unknown as Post;
}

export async function deletePost(id: number): Promise<void> {
  const { error } = await supabase.rpc('soft_delete_post', {
    p_post_id: id,
  });

  if (error) {
    logger.error('[API] deletePost 에러:', error.message);
    throw new APIError(
      error.code === '42501' ? 403 : 500,
      '게시글 삭제에 실패했습니다.',
      error.code,
      error,
    );
  }
}

export async function updatePost(id: number, body: UpdatePostRequest): Promise<UpdatePostResponse> {
  const { data, error } = await supabase.from('posts').update(body).eq('id', id).select().single();

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
}
