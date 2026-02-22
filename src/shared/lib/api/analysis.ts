import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import type { PostAnalysis } from '@/types';

export async function getEmotionTrend(
  days: number = 7,
): Promise<{ emotion: string; cnt: number }[]> {
  const { data, error } = await supabase.rpc('get_emotion_trend', { days });
  if (error) {
    logger.error('[API] getEmotionTrend 에러:', error.message);
    return [];
  }
  return (data ?? []) as { emotion: string; cnt: number }[];
}

export async function getPostAnalysis(postId: number): Promise<PostAnalysis | null> {
  const { data, error } = await supabase
    .from('post_analysis')
    .select('*')
    .eq('post_id', postId)
    .maybeSingle();

  if (error) {
    logger.error('[API] getPostAnalysis 에러:', error.message);
    return null;
  }
  return data as PostAnalysis | null;
}
