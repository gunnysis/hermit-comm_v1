import React, { useMemo } from 'react';
import { View, Text, useColorScheme, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { EMOTION_COLOR_MAP, EMOTION_EMOJI } from '@/shared/lib/constants';
import { Skeleton } from '@/shared/components/Skeleton';
import type { EmotionCalendarDay } from '@/types';

interface EmotionCalendarProps {
  userId: string;
  days?: number;
  onDayPress?: (day: EmotionCalendarDay) => void;
}

export function EmotionCalendar({ userId, days = 30, onDayPress }: EmotionCalendarProps) {
  const isDark = useColorScheme() === 'dark';
  const { data: calendarData = [], isLoading } = useQuery({
    queryKey: ['emotionCalendar', userId, days],
    queryFn: () => api.getUserEmotionCalendar(userId, days),
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

  const uniqueEmotions = useMemo(() => {
    const set = new Set<string>();
    for (const day of calendarData) {
      if (day.emotions?.[0]) set.add(day.emotions[0]);
    }
    return Array.from(set);
  }, [calendarData]);

  if (isLoading) {
    return (
      <View className="mb-4">
        <Skeleton className="w-24 h-4 mb-2" />
        <View className="flex-row gap-1">
          {Array.from({ length: 5 }).map((_, ci) => (
            <View key={ci} className="gap-1">
              {Array.from({ length: 7 }).map((_, ri) => (
                <Skeleton key={ri} className="w-3.5 h-3.5 rounded-sm" />
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (!weeks.length) return null;

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className={`text-sm font-semibold ${isDark ? 'text-stone-100' : 'text-gray-800'}`}>
          감정 캘린더
        </Text>
        <Text style={{ fontSize: 10 }} className={isDark ? 'text-stone-400' : 'text-stone-500'}>
          최근 {days}일
        </Text>
      </View>
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
      {uniqueEmotions.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-2">
          {uniqueEmotions.map((emotion) => {
            const colors = EMOTION_COLOR_MAP[emotion];
            return (
              <View key={emotion} className="flex-row items-center gap-1">
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 9,
                    backgroundColor: colors?.gradient[0] ?? (isDark ? '#333' : '#eee'),
                  }}
                />
                <Text
                  style={{ fontSize: 10 }}
                  className={isDark ? 'text-stone-400' : 'text-stone-500'}>
                  {EMOTION_EMOJI[emotion]} {emotion}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
