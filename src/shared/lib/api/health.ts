import { supabase } from '../supabase';

export async function healthCheck(): Promise<{ status: string }> {
  try {
    const { error } = await supabase.from('posts').select('id').limit(1);
    if (error) return { status: 'error' };
    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}
