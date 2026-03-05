import { supabase } from '../supabase';
import { addBreadcrumb } from '@/shared/utils/sentryBreadcrumb';

export interface ReactionData {
  reaction_type: string;
  count: number;
  user_reacted: boolean;
}

export async function getPostReactions(postId: number): Promise<ReactionData[]> {
  const { data, error } = await supabase.rpc('get_post_reactions', {
    p_post_id: postId,
  });
  if (error) throw error;
  return (data ?? []) as ReactionData[];
}

export async function toggleReaction(postId: number, reactionType: string): Promise<void> {
  const { error } = await supabase.rpc('toggle_reaction', {
    p_post_id: postId,
    p_type: reactionType,
  });
  if (error) throw error;
  addBreadcrumb('reaction', 'toggleReaction', { postId, reactionType });
}
