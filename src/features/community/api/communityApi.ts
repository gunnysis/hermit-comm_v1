import { supabase } from '@/shared/lib/supabase';
import { api } from '@/shared/lib/api';
import { logger } from '@/shared/utils/logger';
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

export interface JoinGroupByInviteCodeResult {
  group: GroupSummary;
  alreadyMember: boolean;
}

export async function getBoards(): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('id', { ascending: true });
  if (error) {
    logger.error('[API] boards 조회 에러:', error.message);
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
    logger.error('[API] 사용자 조회 에러:', userError.message);
    throw userError;
  }
  if (!user) return [];

  const { data, error } = await supabase
    .from('group_members')
    .select('groups(id, name, description), status')
    .eq('user_id', user.id)
    .eq('status', 'approved');

  if (error) {
    logger.error('[API] my groups 조회 에러:', error.message);
    throw error;
  }

  const rows = (data || []) as unknown as { groups: GroupSummary | null }[];

  return rows.map((row) => row.groups).filter((g): g is GroupSummary => !!g);
}

export async function joinGroupByInviteCode(
  inviteCode: string,
): Promise<JoinGroupByInviteCodeResult> {
  const trimmed = inviteCode.trim();
  if (!trimmed) {
    throw new Error('코드를 입력해주세요.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    logger.error('[API] 사용자 조회 에러:', userError.message);
    throw new Error('잠시 후 다시 시도해주세요.');
  }
  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name, description, invite_code')
    .eq('invite_code', trimmed)
    .maybeSingle();

  if (groupError) {
    logger.error('[API] groups 초대 코드 조회 에러:', groupError.message);
    throw new Error('잠시 후 다시 시도해주세요.');
  }
  if (!group) {
    throw new Error('존재하지 않는 초대 코드입니다.');
  }

  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('status')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberError) {
    logger.error('[API] group_members 조회 에러:', memberError.message);
    throw new Error('잠시 후 다시 시도해주세요.');
  }

  if (!member) {
    const { error: insertError } = await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'member',
      status: 'approved',
    });

    if (insertError) {
      logger.error('[API] group_members INSERT 에러:', insertError.message);
      throw new Error('그룹에 참여하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }

    return {
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
      },
      alreadyMember: false,
    };
  }

  if (member.status !== 'approved') {
    const { error: updateError } = await supabase
      .from('group_members')
      .update({ status: 'approved' })
      .eq('group_id', group.id)
      .eq('user_id', user.id);

    if (updateError) {
      logger.error('[API] group_members UPDATE 에러:', updateError.message);
      throw new Error('그룹에 참여하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  return {
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
    },
    alreadyMember: true,
  };
}

export async function getGroupBoards(groupId: number): Promise<GroupBoard[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('visibility', 'private')
    .eq('group_id', groupId)
    .order('id', { ascending: true });

  if (error) {
    logger.error('[API] group boards 조회 에러:', error.message);
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
    logger.error('[API] board posts 조회 에러:', error.message);
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
    logger.error('[API] group posts 조회 에러:', error.message);
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
