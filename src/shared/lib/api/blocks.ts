import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';

export async function blockUser(alias: string): Promise<void> {
  const { error } = await supabase.rpc('block_user', { p_alias: alias });
  if (error) {
    logger.error('[blockUser]', error.message, { code: error.code });
    throw error;
  }
}

export async function unblockUser(alias: string): Promise<void> {
  const { error } = await supabase.rpc('unblock_user', { p_alias: alias });
  if (error) {
    logger.error('[unblockUser]', error.message, { code: error.code });
    throw error;
  }
}

export async function getBlockedAliases(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_blocked_aliases');
  if (error) {
    logger.error('[getBlockedAliases]', error.message, { code: error.code });
    return [];
  }
  return (data as string[]) ?? [];
}
