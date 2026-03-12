import React, { useMemo } from 'react';
import { View, Text, useColorScheme, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { EMOTION_COLOR_MAP } from '@/shared/lib/constants';
import type { EmotionCalendarDay } from '@/types';

async function getUserEmotionCalendar(userId: string, days = 30): Promise<EmotionCalendarDay[]> {
  const start = new Date();
  start.setDate(start.getDate() - days);
  const { data, error } = await supabase.rpc('get_user_emotion_calendar', {
    p_user_id: userId,
    p_start: start.toISOString().slice(0, 10),
    p_end: new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
  return (data ?? []) as EmotionCalendarDay[];
}

interface EmotionCalendarProps {
  userId: string;
  days?: number;
  onDayPress?: (day: EmotionCalendarDay) => void;
}

export function EmotionCalendar({ userId, days = 30, onDayPress }: EmotionCalendarProps) {
  const isDark = useColorScheme() === 'dark';
  const { data: calendarData = [] } = useQuery({
    queryKey: ['emotionCalendar', userId, days],
    queryFn: () => getUserEmotionCalendar(userId, days),
    staleTime: 5 * 60 * 1000,
  });

  const weeks = useMemo(() => {
    if (!calendarData.length) return [];
    const result: EmotionCalendarDay[][] = [];
    let week: EmotionCalendarDay[] = [];
    for (const day of calendarData) {
      const dow = new Date(day.day).getDay();
      if (dow === 0 && week.length > 0) {
        result.push(week);
        week = [];
      }
      week.push(day);
    }
    if (week.length > 0) result.push(week);
    return result;
  }, [calendarData]);

  if (!weeks.length) return null;

  return (
    <View className="mb-4">
      <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-stone-100' : 'text-gray-800'}`}>
        감정 캘린더
      </Text>
      <View className="flex-row gap-1">
        {weeks.map((week, wi) => (
          <View key={wi} className="gap-1">
            {week.map((day) => {
              const primaryEmotion = day.emotions?.[0];
              const colors = primaryEmotion ? EMOTION_COLOR_MAP[primaryEmotion] : null;
              return (
                <Pressable
                  key={day.day}
                  onPress={() => onDayPress?.(day)}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 2,
                    backgroundColor:
                      day.post_count > 0 && colors ? colors.gradient[0] : isDark ? '#333' : '#eee',
                  }}
                  accessibilityLabel={`${day.day}: ${day.post_count}개 글`}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
