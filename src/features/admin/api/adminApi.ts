import { supabase } from '@/shared/lib/supabase';
import { APIError } from '@/shared/lib/api/error';
import { logger } from '@/shared/utils/logger';

export interface CreateGroupWithBoardInput {
  name: string;
  inviteCode: string;
  description?: string;
}

export interface ManagedGroup {
  id: number;
  name: string;
  description?: string | null;
  invite_code: string | null;
  created_at: string;
}

export interface CreateGroupWithBoardResult {
  groupId: number;
  inviteCode: string;
}

/**
 * 그룹 1개 + 기본 보드 1개 + 본인을 owner로 group_members 1건 생성.
 * RLS: app_admin에 등록된 사용자만 호출 가능.
 */
export async function createGroupWithBoard(
  input: CreateGroupWithBoardInput,
): Promise<CreateGroupWithBoardResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw new APIError(500, userError.message, undefined, userError);
  if (!user) throw new APIError(401, '로그인이 필요합니다.');

  const { name, inviteCode, description } = input;
  const trimmedName = name.trim();
  const trimmedCode = inviteCode.trim();
  if (!trimmedName) throw new APIError(400, '그룹명을 입력해주세요.');
  if (!trimmedCode) throw new APIError(400, '초대 코드를 입력해주세요.');

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: trimmedName,
      description: description?.trim() || null,
      invite_code: trimmedCode,
      join_mode: 'invite_only',
      owner_id: user.id,
    })
    .select('id')
    .single();

  if (groupError) {
    logger.error('[adminApi] groups INSERT 에러:', groupError.message);
    throw new APIError(500, groupError.message, groupError.code, groupError);
  }
  if (!group) throw new APIError(500, '그룹 생성 결과를 받지 못했습니다.');

  const { error: memberError } = await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'owner',
    status: 'approved',
  });
  if (memberError) {
    logger.error('[adminApi] group_members INSERT 에러:', memberError.message);
    throw new APIError(500, memberError.message, memberError.code, memberError);
  }

  const { error: boardError } = await supabase.from('boards').insert({
    name: trimmedName,
    visibility: 'private',
    group_id: group.id,
    anon_mode: 'allow_choice',
  });
  if (boardError) {
    logger.error('[adminApi] boards INSERT 에러:', boardError.message);
    throw new APIError(500, boardError.message, boardError.code, boardError);
  }

  return { groupId: group.id, inviteCode: trimmedCode };
}

/**
 * 본인이 owner인 그룹 목록 (초대 코드 포함).
 * RLS: group_members로 조회하는 게 아니라 groups.owner_id로 조회.
 */
export async function getMyManagedGroups(): Promise<ManagedGroup[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw new APIError(500, userError.message, undefined, userError);
  if (!user) return [];

  const { data, error } = await supabase
    .from('groups')
    .select('id, name, description, invite_code, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('[adminApi] my managed groups 조회 에러:', error.message);
    throw new APIError(500, error.message, error.code, error);
  }
  return (data || []) as ManagedGroup[];
}

/**
 * 본인이 소유한 그룹 삭제. RLS: app_admin이면서 owner_id = 본인인 경우만 삭제 가능.
 * 그룹 삭제 시 boards, group_members는 CASCADE로 삭제됨.
 */
export async function deleteGroup(groupId: number): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw new APIError(500, userError.message, undefined, userError);
  if (!user) throw new APIError(401, '로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)
    .eq('owner_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) {
    logger.error('[adminApi] groups DELETE 에러:', error.message);
    throw new APIError(500, error.message, error.code, error);
  }
  if (!data) {
    throw new APIError(404, '삭제할 수 없는 그룹이거나 이미 삭제되었습니다.');
  }
}
