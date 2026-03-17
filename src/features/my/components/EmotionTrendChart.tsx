import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { getWeeklyEmotionSummary } from '@/shared/lib/api/my';
import { EMOTION_EMOJI, EMOTION_COLOR_MAP } from '@/shared/lib/constants';

interface EmotionTrendChartProps {
  enabled?: boolean;
}

/**
 * 최근 4주 감정 트렌드 — 바 차트 (Skia 없이 순수 View 기반)
 */
export function EmotionTrendChart({ enabled = true }: EmotionTrendChartProps) {
  const isDark = useColorScheme() === 'dark';

  // 최근 4주 데이터 병렬 조회
  const week0 = useQuery({
    queryKey: ['weeklySummary', 0],
    queryFn: () => getWeeklyEmotionSummary(0),
    enabled,
    staleTime: 30 * 60 * 1000,
  });
  const week1 = useQuery({
    queryKey: ['weeklySummary', 1],
    queryFn: () => getWeeklyEmotionSummary(1),
    enabled,
    staleTime: 30 * 60 * 1000,
  });
  const week2 = useQuery({
    queryKey: ['weeklySummary', 2],
    queryFn: () => getWeeklyEmotionSummary(2),
    enabled,
    staleTime: 30 * 60 * 1000,
  });
  const week3 = useQuery({
    queryKey: ['weeklySummary', 3],
    queryFn: () => getWeeklyEmotionSummary(3),
    enabled,
    staleTime: 30 * 60 * 1000,
  });

  const weeks = [week3.data, week2.data, week1.data, week0.data].filter(Boolean);
  if (weeks.length < 2) return null;

  // 주별 Top 감정 추출
  const weekData = weeks.map((w) => ({
    label: w!.days_logged > 0 ? `${w!.days_logged}일` : '-',
    topEmotion: w!.top_emotions?.[0]?.emotion ?? null,
    daysLogged: w!.days_logged ?? 0,
  }));

  const maxDays = Math.max(...weekData.map((w) => w.daysLogged), 1);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className={`rounded-2xl p-4 ${isDark ? 'bg-stone-800/50' : 'bg-cream-50'}`}
      style={{
        borderWidth: 1,
        borderColor: isDark ? 'rgba(68,64,60,0.4)' : '#E8DCC8',
      }}>
      <Text
        className={`text-sm font-semibold mb-3 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
        📊 최근 4주 감정 흐름
      </Text>

      {/* 바 차트 */}
      <View className="flex-row items-end justify-between" style={{ height: 80 }}>
        {weekData.map((w, i) => {
          const height = w.daysLogged > 0 ? (w.daysLogged / maxDays) * 60 + 12 : 8;
          const colors = w.topEmotion ? EMOTION_COLOR_MAP[w.topEmotion] : null;
          const barColor = colors?.gradient[0] ?? (isDark ? '#44403c' : '#e7e5e4');

          return (
            <View key={i} className="items-center flex-1">
              {/* 이모지 */}
              {w.topEmotion && <Text className="text-xs mb-1">{EMOTION_EMOJI[w.topEmotion]}</Text>}
              {/* 바 */}
              <View className="w-8 rounded-t-lg" style={{ height, backgroundColor: barColor }} />
              {/* 라벨 */}
              <Text className={`text-[10px] mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                {i === 3 ? '이번주' : `${3 - i}주전`}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 범례 */}
      <View className="flex-row flex-wrap gap-2 mt-3 pt-2 border-t border-stone-200 dark:border-stone-700">
        {weekData
          .filter((w) => w.topEmotion)
          .reduce(
            (acc, w) => {
              if (!acc.find((a) => a.emotion === w.topEmotion)) {
                acc.push({ emotion: w.topEmotion! });
              }
              return acc;
            },
            [] as { emotion: string }[],
          )
          .map((item) => (
            <Text
              key={item.emotion}
              className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {EMOTION_EMOJI[item.emotion]} {item.emotion}
            </Text>
          ))}
      </View>
    </Animated.View>
  );
}
