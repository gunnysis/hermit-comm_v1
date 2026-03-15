import { supabase } from '../supabase';

export async function blockUser(alias: string): Promise<void> {
  await supabase.rpc('block_user', { p_alias: alias });
}

export async function unblockUser(alias: string): Promise<void> {
  await supabase.rpc('unblock_user', { p_alias: alias });
}

export async function getBlockedAliases(): Promise<string[]> {
  const { data } = await supabase.rpc('get_blocked_aliases');
  return (data as string[]) ?? [];
}
