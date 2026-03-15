import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import type { EmotionTimelineEntry } from '@/types';

export interface ActivitySummary {
  post_count: number;
  comment_count: number;
  reaction_count: number;
  streak: number;
}

export async function getActivitySummary(): Promise<ActivitySummary> {
  const { data, error } = await supabase.rpc('get_my_activity_summary');
  if (error) {
    logger.error('[getActivitySummary] failed:', error);
    throw error;
  }
  return data as unknown as ActivitySummary;
}

export async function getEmotionTimeline(days = 7): Promise<EmotionTimelineEntry[]> {
  const { data, error } = await supabase.rpc('get_emotion_timeline', { p_days: days });
  if (error) {
    logger.error('[getEmotionTimeline] failed:', error);
    throw error;
  }
  return (data ?? []) as EmotionTimelineEntry[];
}

export interface DailyInsightsResult {
  total_dailies: number;
  activity_emotion_map: {
    activity: string;
    count: number;
    emotions: { emotion: string; pct: number }[];
  }[];
}

export async function getDailyInsights(days = 30): Promise<DailyInsightsResult> {
  const { data, error } = await supabase.rpc('get_daily_activity_insights', { p_days: days });
  if (error) {
    logger.error('[getDailyInsights] failed:', error);
    throw error;
  }
  return data as unknown as DailyInsightsResult;
}

export interface YesterdayDailyReactions {
  post_id: number;
  like_count: number;
  comment_count: number;
}

export async function getYesterdayDailyReactions(): Promise<YesterdayDailyReactions | null> {
  // 어제 KST 범위
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstToday = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
  const kstYesterday = new Date(kstToday.getTime() - 24 * 60 * 60 * 1000);

  const yesterdayStart = new Date(kstYesterday.getTime() - kstOffset).toISOString();
  const yesterdayEnd = new Date(kstToday.getTime() - kstOffset).toISOString();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('posts_with_like_count')
    .select('id, like_count, comment_count')
    .eq('author_id', user.id)
    .eq('post_type', 'daily')
    .gte('created_at', yesterdayStart)
    .lt('created_at', yesterdayEnd)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  if (data.like_count === 0 && data.comment_count === 0) return null;

  return {
    post_id: data.id as number,
    like_count: (data.like_count ?? 0) as number,
    comment_count: (data.comment_count ?? 0) as number,
  };
}

export interface SameMoodDaily {
  id: number;
  content: string;
  emotions: string[];
  activities: string[];
}

export async function getSameMoodDailies(
  postId: number,
  emotions: string[],
): Promise<SameMoodDaily[]> {
  if (!emotions.length) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // 오늘 KST 범위
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstToday = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
  const todayStart = new Date(kstToday.getTime() - kstOffset).toISOString();

  const { data, error } = await supabase
    .from('posts_with_like_count')
    .select('id, content, emotions, activities')
    .eq('post_type', 'daily')
    .gte('created_at', todayStart)
    .neq('author_id', user.id)
    .neq('id', postId)
    .overlaps('emotions', emotions)
    .limit(3);

  if (error || !data) return [];
  return data as SameMoodDaily[];
}

export async function getMyAlias(): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_my_alias');
  if (error) return null;
  return data as string | null;
}
