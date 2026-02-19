import { supabase } from '@/shared/lib/supabase';
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
  if (userError) throw userError;
  if (!user) throw new Error('로그인이 필요합니다.');

  const { name, inviteCode, description } = input;
  const trimmedName = name.trim();
  const trimmedCode = inviteCode.trim();
  if (!trimmedName) throw new Error('그룹명을 입력해주세요.');
  if (!trimmedCode) throw new Error('초대 코드를 입력해주세요.');

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
    throw groupError;
  }
  if (!group) throw new Error('그룹 생성 결과를 받지 못했습니다.');

  const { error: memberError } = await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'owner',
    status: 'approved',
  });
  if (memberError) {
    logger.error('[adminApi] group_members INSERT 에러:', memberError.message);
    throw memberError;
  }

  const { error: boardError } = await supabase.from('boards').insert({
    name: trimmedName,
    visibility: 'private',
    group_id: group.id,
    anon_mode: 'allow_choice',
  });
  if (boardError) {
    logger.error('[adminApi] boards INSERT 에러:', boardError.message);
    throw boardError;
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
  if (userError) throw userError;
  if (!user) return [];

  const { data, error } = await supabase
    .from('groups')
    .select('id, name, description, invite_code, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('[adminApi] my managed groups 조회 에러:', error.message);
    throw error;
  }
  return (data || []) as ManagedGroup[];
}
