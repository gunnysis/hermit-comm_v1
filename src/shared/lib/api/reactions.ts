import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import { addBreadcrumb } from '@/shared/utils/sentryBreadcrumb';
import { APIError } from './error';
import { extractErrorMessage } from './helpers';

export interface ReactionData {
  reaction_type: string;
  count: number;
  user_reacted: boolean;
}

export async function getPostReactions(postId: number): Promise<ReactionData[]> {
  const { data, error } = await supabase.rpc('get_post_reactions', {
    p_post_id: postId,
  });
  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] getPostReactions 에러:', errorMsg, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new APIError(500, errorMsg);
  }
  return (data ?? []) as ReactionData[];
}

export async function toggleReaction(postId: number, reactionType: string): Promise<void> {
  const { error } = await supabase.rpc('toggle_reaction', {
    p_post_id: postId,
    p_type: reactionType,
  });
  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] toggleReaction 에러:', errorMsg, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new APIError(500, errorMsg);
  }
  addBreadcrumb('reaction', 'toggleReaction', { postId, reactionType });
}
