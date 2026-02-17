import { supabase } from '@/shared/lib/supabase';
import { api } from '@/shared/lib/api';
import type { Board, Post } from '@/types';

export type BoardSortOrder = 'latest' | 'popular';

export interface GetBoardPostsOptions {
  limit?: number;
  offset?: number;
  sortOrder?: BoardSortOrder;
}

export interface CreateAnonymousPostInput {
  title: string;
  content: string;
  author: string;
  boardId: number;
  groupId?: number;
  isAnonymous?: boolean;
  displayName?: string;
}

export interface GroupSummary {
  id: number;
  name: string;
  description?: string | null;
}

export interface GroupBoard extends Board {
  group_id?: number | null;
}

export async function getBoards(): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('id', { ascending: true });
  if (error) {
    console.error('[Supabase] boards 조회 에러:', error);
    throw error;
  }
  return (data || []) as Board[];
}

export async function getMyGroups(): Promise<GroupSummary[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    console.error('[Supabase] 사용자 조회 에러:', userError);
    throw userError;
  }
  if (!user) return [];

  const { data, error } = await supabase
    .from('group_members')
    .select('groups(id, name, description), status')
    .eq('user_id', user.id)
    .eq('status', 'approved');

  if (error) {
    console.error('[Supabase] my groups 조회 에러:', error);
    throw error;
  }

  const rows = (data || []) as unknown as { groups: GroupSummary | null }[];

  return rows.map((row) => row.groups).filter((g): g is GroupSummary => !!g);
}

export async function getGroupBoards(groupId: number): Promise<GroupBoard[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('visibility', 'private')
    .eq('group_id', groupId)
    .order('id', { ascending: true });

  if (error) {
    console.error('[Supabase] group boards 조회 에러:', error);
    throw error;
  }
  return (data || []) as GroupBoard[];
}

export async function getBoardPosts(
  boardId: number,
  options: GetBoardPostsOptions = {},
): Promise<Post[]> {
  const { limit = 20, offset = 0, sortOrder = 'latest' } = options;

  // 현재는 게시판 단위 조회는 posts 테이블 기준으로만 정렬 (최신순 우선)
  const { data, error } = await supabase
    .from('posts')
    .select('*, comments(count)')
    .eq('board_id', boardId)
    .order(sortOrder === 'popular' ? 'created_at' : 'created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Supabase] board posts 조회 에러:', error);
    throw error;
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
}

export async function createBoardPost(input: CreateAnonymousPostInput): Promise<Post> {
  const { title, content, author, boardId, groupId, isAnonymous, displayName } = input;
  return api.createPost({
    title,
    content,
    author,
    board_id: boardId,
    group_id: groupId,
    is_anonymous: isAnonymous,
    display_name: displayName,
  });
}

export async function getGroupPosts(
  groupId: number,
  boardId: number,
  options: GetBoardPostsOptions = {},
): Promise<Post[]> {
  const { limit = 20, offset = 0, sortOrder = 'latest' } = options;

  const { data, error } = await supabase
    .from('posts')
    .select('*, comments(count)')
    .eq('group_id', groupId)
    .eq('board_id', boardId)
    .order(sortOrder === 'popular' ? 'created_at' : 'created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Supabase] group posts 조회 에러:', error);
    throw error;
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
}
