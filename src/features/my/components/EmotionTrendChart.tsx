import React, { useMemo } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useQueries } from '@tanstack/react-query';
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
  const weekQueries = useQueries({
    queries: [3, 2, 1, 0].map((offset) => ({
      queryKey: ['weeklySummary', offset],
      queryFn: () => getWeeklyEmotionSummary(offset),
      enabled,
      staleTime: 30 * 60 * 1000,
      meta: { silent: true },
    })),
  });

  const weeks = useMemo(
    () => weekQueries.map((q) => q.data).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekQueries.map((q) => q.dataUpdatedAt).join(',')],
  );

  // 주별 Top 감정 추출
  const weekData = useMemo(
    () =>
      weeks.map((w) => ({
        label: w!.days_logged > 0 ? `${w!.days_logged}일` : '-',
        topEmotion: w!.top_emotions?.[0]?.emotion ?? null,
        daysLogged: w!.days_logged ?? 0,
      })),
    [weeks],
  );

  const maxDays = useMemo(() => Math.max(...weekData.map((w) => w.daysLogged), 1), [weekData]);

  // 범례: 유니크 감정만
  const legendEmotions = useMemo(
    () => [...new Set(weekData.filter((w) => w.topEmotion).map((w) => w.topEmotion!))],
    [weekData],
  );

  if (weeks.length < 2) return null;

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
        {legendEmotions.map((emotion) => (
          <Text
            key={emotion}
            className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {EMOTION_EMOJI[emotion]} {emotion}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
}
