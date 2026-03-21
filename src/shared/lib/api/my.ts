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
  if (error) {
    logger.error('[getYesterdayDailyReactions] failed:', error);
    throw error;
  }
  if (!data) return null;
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
  if (error) {
    logger.error('[getSameMoodDailies] failed:', error);
    throw error;
  }
  if (!data) return [];
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
    throw error;
  }
  return data as unknown as WeeklyEmotionSummary | null;
}

export interface StreakData {
  current_streak: number;
  total_days: number;
  longest_streak: number;
  completed_today: boolean;
  new_milestone: number;
}

export async function getMyStreak(): Promise<StreakData> {
  const { data, error } = await supabase.rpc('get_my_streak');
  if (error) {
    logger.error('[getMyStreak] failed:', error);
    throw error;
  }
  return data as unknown as StreakData;
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

export interface DailyHistoryItem {
  id: number;
  emotions: string[] | null;
  activities: string[] | null;
  content: string | null;
  created_date_kst: string;
  created_at: string;
  like_count: number;
  comment_count: number;
}

export async function getDailyHistory(limit = 20, offset = 0): Promise<DailyHistoryItem[]> {
  const { data, error } = await supabase.rpc('get_my_daily_history', {
    p_limit: limit,
    p_offset: offset,
  });
  if (error) {
    logger.error('[getDailyHistory] failed:', error);
    throw error;
  }
  return (data ?? []) as unknown as DailyHistoryItem[];
}

export interface MonthlyEmotionReport {
  year: number;
  month: number;
  days_in_month: number;
  days_logged: number;
  top_emotions: { emotion: string; count: number }[];
  top_activities: { activity: string; count: number }[];
  total_reactions: number;
  total_comments: number;
}

export async function getMonthlyEmotionReport(
  year: number,
  month: number,
): Promise<MonthlyEmotionReport> {
  const { data, error } = await supabase.rpc('get_monthly_emotion_report', {
    p_year: year,
    p_month: month,
  });
  if (error) {
    logger.error('[getMonthlyEmotionReport] failed:', error);
    throw error;
  }
  return data as unknown as MonthlyEmotionReport;
}

export async function getMyAlias(): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_my_alias');
  if (error) {
    logger.error('[getMyAlias] failed:', error);
    throw error;
  }
  return data as string | null;
}
