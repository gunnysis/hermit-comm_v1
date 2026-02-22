import { supabase } from '../supabase';
import { APIError } from './error';
import type {
  Reaction,
  CreateReactionRequest,
  GetReactionsResponse,
  CreateReactionResponse,
} from '@/types';

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

export async function createReaction(
  postId: number,
  reactionData: CreateReactionRequest,
): Promise<CreateReactionResponse> {
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
}
