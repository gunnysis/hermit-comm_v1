import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useEmotionTrend } from '../hooks/useEmotionTrend';
import { EMOTION_EMOJI } from '@/shared/lib/constants';

interface EmotionTrendProps {
  days?: number;
  className?: string;
}

export function EmotionTrend({ days = 7, className = '' }: EmotionTrendProps) {
  const router = useRouter();
  const { data: trend = [], isLoading } = useEmotionTrend(days);
  const top3 = trend.slice(0, 3);

  if (isLoading || top3.length === 0) {
    return null;
  }

  return (
    <View
      className={`rounded-xl border border-cream-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-3 mb-2 ${className}`.trim()}
      accessibilityLabel={`요즘 마을 분위기: ${top3.map((t) => t.emotion).join(', ')}`}>
      <Text className="text-xs text-gray-500 dark:text-stone-400 mb-1.5">요즘 마을 분위기</Text>
      <View className="flex-row flex-wrap gap-2">
        {top3.map(({ emotion, cnt, pct }) => {
          const emoji = EMOTION_EMOJI[emotion] ?? '💬';
          return (
            <Pressable
              key={emotion}
              onPress={() => router.push({ pathname: '/search', params: { emotion } })}
              className="rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1.5 active:opacity-70">
              <Text className="text-sm text-stone-600 dark:text-stone-300">
                {emoji} {emotion} {pct != null ? `${pct}%` : cnt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
