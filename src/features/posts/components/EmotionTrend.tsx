import React from 'react';
import { View, Text } from 'react-native';
import { useEmotionTrend } from '../hooks/useEmotionTrend';

interface EmotionTrendProps {
  days?: number;
  className?: string;
}

export function EmotionTrend({ days = 7, className = '' }: EmotionTrendProps) {
  const { data: trend = [], isLoading } = useEmotionTrend(days);
  const top3 = trend.slice(0, 3);

  if (isLoading || top3.length === 0) {
    return null;
  }

  return (
    <View
      className={`rounded-2xl border border-cream-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 mb-4 ${className}`.trim()}
      accessibilityLabel={`요즘 마을 분위기: ${top3.map((t) => t.emotion).join(', ')}`}>
      <Text className="text-sm text-gray-500 dark:text-stone-400 mb-2">요즘 마을 분위기</Text>
      <View className="flex-row flex-wrap gap-2">
        {top3.map(({ emotion }) => (
          <View key={emotion} className="rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1.5">
            <Text className="text-sm text-stone-600 dark:text-stone-300">{emotion}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
