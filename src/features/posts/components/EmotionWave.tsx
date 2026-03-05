import React, { useMemo } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { EMOTION_COLOR_MAP, EMOTION_EMOJI } from '@/shared/lib/constants';
import type { EmotionTimelineEntry } from '@/types';

async function getEmotionTimeline(days = 7): Promise<EmotionTimelineEntry[]> {
  const { data, error } = await supabase.rpc('get_emotion_timeline', { p_days: days });
  if (error) throw error;
  return (data ?? []) as EmotionTimelineEntry[];
}

interface EmotionWaveProps {
  days?: number;
}

export function EmotionWave({ days = 7 }: EmotionWaveProps) {
  const isDark = useColorScheme() === 'dark';
  const { data: timeline = [] } = useQuery({
    queryKey: ['emotionTimeline', days],
    queryFn: () => getEmotionTimeline(days),
    staleTime: 5 * 60 * 1000,
  });

  const { topEmotions, bars, maxTotal } = useMemo(() => {
    if (!timeline.length)
      return {
        topEmotions: [] as string[],
        bars: [] as {
          day: string;
          segments: { emotion: string; count: number }[];
          total: number;
        }[],
        maxTotal: 0,
      };

    const byDay = new Map<string, Map<string, number>>();
    for (const entry of timeline) {
      if (!byDay.has(entry.day)) byDay.set(entry.day, new Map());
      byDay.get(entry.day)!.set(entry.emotion, Number(entry.cnt));
    }

    const emotionTotals = new Map<string, number>();
    for (const dayMap of byDay.values()) {
      for (const [emotion, cnt] of dayMap) {
        emotionTotals.set(emotion, (emotionTotals.get(emotion) ?? 0) + cnt);
      }
    }

    const topEmotions = [...emotionTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([e]) => e);

    const topSet = new Set(topEmotions);
    const dayLabels = [...byDay.keys()].sort();
    const bars = dayLabels.map((day) => {
      const dayMap = byDay.get(day)!;
      const segments: { emotion: string; count: number }[] = [];
      for (const emotion of topSet) {
        const count = dayMap.get(emotion) ?? 0;
        if (count > 0) segments.push({ emotion, count });
      }
      const total = segments.reduce((s, seg) => s + seg.count, 0);
      return { day, segments, total };
    });

    return { topEmotions, bars, maxTotal: Math.max(...bars.map((b) => b.total)) };
  }, [timeline]);

  if (!bars.length) return null;

  return (
    <View className="mb-4">
      <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-stone-100' : 'text-gray-800'}`}>
        감정 타임라인
      </Text>
      <View className="flex-row items-end gap-1" style={{ height: 80 }}>
        {bars.map((bar) => (
          <View key={bar.day} className="flex-1 justify-end" style={{ height: '100%' }}>
            <View
              className="rounded-t overflow-hidden"
              style={{ height: `${(bar.total / (maxTotal || 1)) * 100}%` }}>
              {bar.segments.map((seg) => {
                const colors = EMOTION_COLOR_MAP[seg.emotion];
                return (
                  <View
                    key={seg.emotion}
                    style={{
                      flex: seg.count,
                      backgroundColor: colors?.gradient[1] ?? '#E7D7FF',
                    }}
                  />
                );
              })}
            </View>
            <Text
              className={`text-center mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}
              style={{ fontSize: 9 }}>
              {new Date(bar.day).getDate()}일
            </Text>
          </View>
        ))}
      </View>
      <View className="flex-row flex-wrap gap-2 mt-2">
        {topEmotions.map((emotion) => {
          const colors = EMOTION_COLOR_MAP[emotion];
          return (
            <View key={emotion} className="flex-row items-center gap-1">
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors?.gradient[1] ?? '#E7D7FF',
                }}
              />
              <Text
                className={`${isDark ? 'text-stone-400' : 'text-stone-500'}`}
                style={{ fontSize: 10 }}>
                {EMOTION_EMOJI[emotion]} {emotion}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
