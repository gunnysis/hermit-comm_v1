import { supabase } from '../supabase';
import { APIError } from './error';
import type { Reaction, GetReactionsResponse, ToggleReactionResponse } from '@/types';

export async function getReactions(postId: number): Promise<GetReactionsResponse> {
  const { data, error } = await supabase
    .from('reactions')
    .select('reaction_type, count')
    .eq('post_id', postId);

  if (error) {
    throw new APIError(500, error.message);
  }

  return (data || []) as Reaction[];
}

/** 현재 로그인 사용자가 해당 게시글에 남긴 반응 타입 목록 */
export async function getUserReactions(postId: number): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('user_reactions')
    .select('reaction_type')
    .eq('post_id', postId)
    .eq('user_id', user.id);

  return (data || []).map((r: { reaction_type: string }) => r.reaction_type);
}

/**
 * 반응 토글: 이미 반응했으면 취소, 아니면 추가.
 * reactions(집계) + user_reactions(개인 기록)를 함께 갱신.
 */
export async function toggleReaction(
  postId: number,
  reactionType: string,
): Promise<ToggleReactionResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new APIError(401, '로그인이 필요합니다.');

  // 이미 반응했는지 확인
  const { data: existing } = await supabase
    .from('user_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('reaction_type', reactionType)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // 취소: user_reactions 삭제 + 집계 카운트 감소
    await supabase.from('user_reactions').delete().eq('id', existing.id);

    const { data: aggRow } = await supabase
      .from('reactions')
      .select('id, count')
      .eq('post_id', postId)
      .eq('reaction_type', reactionType)
      .single();

    if (aggRow) {
      if (aggRow.count <= 1) {
        await supabase.from('reactions').delete().eq('id', aggRow.id);
      } else {
        await supabase
          .from('reactions')
          .update({ count: aggRow.count - 1 })
          .eq('id', aggRow.id);
      }
    }

    return { reacted: false, reaction_type: reactionType };
  } else {
    // 추가: user_reactions 삽입 + 집계 카운트 증가
    const { error: insertError } = await supabase
      .from('user_reactions')
      .insert([{ user_id: user.id, post_id: postId, reaction_type: reactionType }]);

    if (insertError) {
      throw new APIError(500, '반응 추가에 실패했습니다.', insertError.code, insertError);
    }

    const { data: aggRow } = await supabase
      .from('reactions')
      .select('id, count')
      .eq('post_id', postId)
      .eq('reaction_type', reactionType)
      .single();

    if (aggRow) {
      await supabase
        .from('reactions')
        .update({ count: aggRow.count + 1 })
        .eq('id', aggRow.id);
    } else {
      await supabase
        .from('reactions')
        .insert([{ post_id: postId, reaction_type: reactionType, count: 1 }]);
    }

    return { reacted: true, reaction_type: reactionType };
  }
}
