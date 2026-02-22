import React from 'react';
import { View, Text } from 'react-native';

interface EmotionTagsProps {
  emotions: string[];
  isLoading?: boolean;
  className?: string;
}

/** 분석 완료 전 스켈레톤 2~3개 */
function EmotionTagsSkeleton() {
  return (
    <View className="flex-row flex-wrap gap-2">
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="h-7 w-16 rounded-full bg-stone-200 dark:bg-stone-700"
          accessibilityLabel="감정 분석 중"
        />
      ))}
    </View>
  );
}

export function EmotionTags({ emotions, isLoading, className = '' }: EmotionTagsProps) {
  if (isLoading) {
    return (
      <View className={`mb-4 ${className}`.trim()}>
        <Text className="text-sm text-stone-500 dark:text-stone-400 mb-2">🏷 오늘의 감정</Text>
        <EmotionTagsSkeleton />
      </View>
    );
  }

  if (!emotions?.length) {
    return null;
  }

  return (
    <View
      className={`mb-4 ${className}`.trim()}
      accessibilityLabel={`감정 태그: ${emotions.join(', ')}`}>
      <Text className="text-sm text-stone-500 dark:text-stone-400 mb-2">🏷 오늘의 감정</Text>
      <View className="flex-row flex-wrap gap-2">
        {emotions.map((emotion) => (
          <View key={emotion} className="rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1">
            <Text className="text-sm text-stone-600 dark:text-stone-300">{emotion}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
