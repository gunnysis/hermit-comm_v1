import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import type { EmotionTimelineEntry, ActivitySummary, EmotionCalendarDay } from '@/types';

export type { ActivitySummary };

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
  const { data, error } = await supabase.rpc('get_yesterday_daily_reactions');
  if (error || !data) return null;
  const result = data as unknown as YesterdayDailyReactions;
  if (!result?.post_id) return null;
  return result;
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
  const { data, error } = await supabase.rpc('get_same_mood_dailies', {
    p_post_id: postId,
    p_emotions: emotions,
  });
  if (error || !data) return [];
  return (Array.isArray(data) ? data : []) as unknown as SameMoodDaily[];
}

export interface WeeklyEmotionSummary {
  week_start: string;
  week_end: string;
  days_logged: number;
  top_emotions: { emotion: string; count: number }[] | null;
  top_activity: string | null;
}

export async function getWeeklyEmotionSummary(
  weekOffset = 0,
): Promise<WeeklyEmotionSummary | null> {
  const { data, error } = await supabase.rpc('get_weekly_emotion_summary', {
    p_week_offset: weekOffset,
  });
  if (error) {
    logger.error('[getWeeklyEmotionSummary] failed:', error);
    return null;
  }
  return data as unknown as WeeklyEmotionSummary | null;
}

export async function getUserEmotionCalendar(
  userId: string,
  days = 30,
): Promise<EmotionCalendarDay[]> {
  const start = new Date();
  start.setDate(start.getDate() - days);
  const { data, error } = await supabase.rpc('get_user_emotion_calendar', {
    p_user_id: userId,
    p_start: start.toISOString().slice(0, 10),
    p_end: new Date().toISOString().slice(0, 10),
  });
  if (error) {
    logger.error('[getUserEmotionCalendar] failed:', error);
    throw error;
  }
  return (data ?? []) as EmotionCalendarDay[];
}

export async function getMyAlias(): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_my_alias');
  if (error) return null;
  return data as string | null;
}
