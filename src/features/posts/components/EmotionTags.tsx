import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { EMOTION_EMOJI } from '@/shared/lib/constants';

interface EmotionTagsProps {
  emotions: string[];
  isLoading?: boolean;
  className?: string;
  /** 감정 태그 클릭 시 콜백 (검색 이동 등) */
  onPress?: (emotion: string) => void;
  /** 분석 실패 시 재시도 콜백 */
  onRetry?: () => void;
  /** 분석 완료 여부 (false이고 emotions 비어있으면 재시도 버튼 표시) */
  analysisDone?: boolean;
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

export function EmotionTags({
  emotions,
  isLoading,
  className = '',
  onPress,
  onRetry,
  analysisDone,
}: EmotionTagsProps) {
  if (isLoading) {
    return (
      <View className={`mb-4 ${className}`.trim()}>
        <Text className="text-sm text-stone-500 dark:text-stone-400 mb-2">🏷 이 글의 감정</Text>
        <EmotionTagsSkeleton />
      </View>
    );
  }

  // 분석 완료됐지만 결과 없음 + 재시도 가능
  if (analysisDone && !emotions?.length && onRetry) {
    return (
      <View className={`mb-4 ${className}`.trim()}>
        <Text className="text-sm text-stone-500 dark:text-stone-400 mb-2">🏷 이 글의 감정</Text>
        <Pressable
          onPress={onRetry}
          className="rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1.5 self-start active:opacity-70"
          accessibilityLabel="감정 분석 재시도"
          accessibilityRole="button">
          <Text className="text-sm text-stone-600 dark:text-stone-300">🔄 분석 재시도</Text>
        </Pressable>
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
      <Text className="text-sm text-stone-500 dark:text-stone-400 mb-2">🏷 이 글의 감정</Text>
      <View className="flex-row flex-wrap gap-2">
        {emotions.map((emotion) => {
          const emoji = EMOTION_EMOJI[emotion] ?? '💬';
          const content = (
            <Text className="text-sm text-stone-600 dark:text-stone-300">
              {emoji} {emotion}
            </Text>
          );

          if (onPress) {
            return (
              <Pressable
                key={emotion}
                onPress={() => onPress(emotion)}
                className="rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1 active:opacity-70"
                accessibilityLabel={`${emotion} 검색`}
                accessibilityRole="button">
                {content}
              </Pressable>
            );
          }

          return (
            <View key={emotion} className="rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1">
              {content}
            </View>
          );
        })}
      </View>
    </View>
  );
}
