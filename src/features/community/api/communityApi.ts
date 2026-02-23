import { supabase } from '@/shared/lib/supabase';
import { api } from '@/shared/lib/api';
import { APIError } from '@/shared/lib/api/error';
import { logger } from '@/shared/utils/logger';
import { addBreadcrumb } from '@/shared/utils/sentryBreadcrumb';
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
    throw new APIError(500, error.message, error.code, error);
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
    throw new APIError(500, userError.message, undefined, userError);
  }
  if (!user) return [];

  const { data, error } = await supabase
    .from('group_members')
    .select('groups(id, name, description), status')
    .eq('user_id', user.id)
    .eq('status', 'approved');

  if (error) {
    logger.error('[API] my groups 조회 에러:', error.message);
    throw new APIError(500, error.message, error.code, error);
  }

  const rows = (data || []) as unknown as { groups: GroupSummary | null }[];

  return rows.map((row) => row.groups).filter((g): g is GroupSummary => !!g);
}

export async function joinGroupByInviteCode(
  inviteCode: string,
): Promise<JoinGroupByInviteCodeResult> {
  const trimmed = inviteCode.trim();
  if (!trimmed) {
    throw new APIError(400, '코드를 입력해주세요.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    logger.error('[API] 사용자 조회 에러:', userError.message);
    throw new APIError(500, '잠시 후 다시 시도해주세요.', undefined, userError);
  }
  if (!user) {
    throw new APIError(401, '로그인이 필요합니다.');
  }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name, description, invite_code')
    .eq('invite_code', trimmed)
    .maybeSingle();

  if (groupError) {
    logger.error('[API] groups 초대 코드 조회 에러:', groupError.message);
    throw new APIError(500, '잠시 후 다시 시도해주세요.', groupError.code, groupError);
  }
  if (!group) {
    throw new APIError(404, '존재하지 않는 초대 코드입니다.');
  }

  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('status')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberError) {
    logger.error('[API] group_members 조회 에러:', memberError.message);
    throw new APIError(500, '잠시 후 다시 시도해주세요.', memberError.code, memberError);
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
      throw new APIError(
        500,
        '그룹에 참여하지 못했습니다. 잠시 후 다시 시도해주세요.',
        insertError.code,
        insertError,
      );
    }

    addBreadcrumb('group', '그룹 참여 성공', { group_id: group.id, alreadyMember: false });
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
      throw new APIError(
        500,
        '그룹에 참여하지 못했습니다. 잠시 후 다시 시도해주세요.',
        updateError.code,
        updateError,
      );
    }
  }

  addBreadcrumb('group', '그룹 참여 성공', { group_id: group.id, alreadyMember: true });
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
    throw new APIError(500, error.message, error.code, error);
  }
  return (data || []) as GroupBoard[];
}

export async function getBoardPosts(
  boardId: number,
  options: GetBoardPostsOptions = {},
): Promise<Post[]> {
  const { limit = 20, offset = 0, sortOrder = 'latest' } = options;

  const orderCol = sortOrder === 'popular' ? 'like_count' : 'created_at';
  const { data, error } = await supabase
    .from('posts_with_like_count')
    .select('*')
    .eq('board_id', boardId)
    .order(orderCol, { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('[API] board posts 조회 에러:', error.message);
    throw new APIError(500, error.message, error.code, error);
  }

  return (data || []) as Post[];
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

  const orderCol = sortOrder === 'popular' ? 'like_count' : 'created_at';
  const { data, error } = await supabase
    .from('posts_with_like_count')
    .select('*')
    .eq('group_id', groupId)
    .eq('board_id', boardId)
    .order(orderCol, { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('[API] group posts 조회 에러:', error.message);
    throw new APIError(500, error.message, error.code, error);
  }

  return (data || []) as Post[];
}

export async function searchGroupPosts(
  groupId: number,
  boardId: number,
  query: string,
  limit: number = 50,
): Promise<Post[]> {
  const q = query.trim();
  if (!q) return [];

  const escaped = q.replace(/'/g, "''");
  const { data, error } = await supabase
    .from('posts_with_like_count')
    .select('*')
    .eq('group_id', groupId)
    .eq('board_id', boardId)
    .or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`)
    .order('created_at', { ascending: false })
    .range(0, limit - 1);

  if (error) {
    logger.error('[API] group posts 검색 에러:', error.message);
    throw new APIError(500, error.message, error.code, error);
  }

  return (data || []) as Post[];
}

export async function leaveGroup(groupId: number): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    logger.error('[API] 사용자 조회 에러:', userError.message);
    throw new APIError(500, '잠시 후 다시 시도해주세요.', undefined, userError);
  }
  if (!user) {
    throw new APIError(401, '로그인이 필요합니다.');
  }

  const { error } = await supabase
    .from('group_members')
    .update({ status: 'left', left_at: new Date().toISOString() })
    .eq('group_id', groupId)
    .eq('user_id', user.id);

  if (error) {
    logger.error('[API] group leave 에러:', error.message);
    throw new APIError(
      500,
      '그룹에서 나가지 못했습니다. 잠시 후 다시 시도해주세요.',
      error.code,
      error,
    );
  }
}
