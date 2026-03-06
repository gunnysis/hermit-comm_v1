import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { EMOTION_EMOJI } from '@/shared/lib/constants';
import type { AnalysisStatus } from '@/types';

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
  /** DB 분석 상태 */
  analysisStatus?: AnalysisStatus;
  /** 재시도 횟수 */
  retryCount?: number;
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

/** 최대 재시도 횟수 */
const MAX_RETRY_COUNT = 3;

export function EmotionTags({
  emotions,
  isLoading,
  className = '',
  onPress,
  onRetry,
  analysisDone,
  analysisStatus,
  retryCount = 0,
}: EmotionTagsProps) {
  // 1. 로딩 / pending / analyzing → 스켈레톤
  if (isLoading || analysisStatus === 'pending' || analysisStatus === 'analyzing') {
    return (
      <View className={`mb-4 ${className}`.trim()}>
        <Text className="text-sm text-stone-500 dark:text-stone-400 mb-2">
          감정을 분석하고 있어요...
        </Text>
        <EmotionTagsSkeleton />
      </View>
    );
  }

  // 2. 실패 + 재시도 가능 (MAX_RETRY_COUNT 미만)
  if (analysisStatus === 'failed' && retryCount < MAX_RETRY_COUNT && onRetry) {
    return (
      <View className={`mb-4 ${className}`.trim()}>
        <Text className="text-sm text-stone-500 dark:text-stone-400 mb-2">
          감정 분석에 실패했어요
        </Text>
        <Pressable
          onPress={onRetry}
          className="rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1.5 self-start active:opacity-70"
          accessibilityLabel="감정 분석 재시도"
          accessibilityRole="button">
          <Text className="text-sm text-stone-600 dark:text-stone-300">다시 시도하기</Text>
        </Pressable>
      </View>
    );
  }

  // 3. 실패 + 재시도 소진
  if (analysisStatus === 'failed' && retryCount >= MAX_RETRY_COUNT) {
    return (
      <View className={`mb-4 ${className}`.trim()}>
        <Text className="text-sm text-stone-400 dark:text-stone-500">
          감정 분석을 완료하지 못했어요
        </Text>
      </View>
    );
  }

  // 4. 성공 + 감정 있음 → 태그 표시
  if (emotions?.length > 0) {
    return (
      <View
        className={`mb-4 ${className}`.trim()}
        accessibilityLabel={`감정 태그: ${emotions.join(', ')}`}>
        <Text className="text-sm text-stone-500 dark:text-stone-400 mb-2">이 글의 감정</Text>
        <View className="flex-row flex-wrap gap-2">
          {emotions.map((emotion) => {
            const emoji = EMOTION_EMOJI[emotion] ?? '';
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

  // 5. (레거시 호환) analysisStatus 없이 analysisDone 기반 재시도
  if (analysisDone && !emotions?.length && onRetry) {
    return (
      <View className={`mb-4 ${className}`.trim()}>
        <Text className="text-sm text-stone-500 dark:text-stone-400 mb-2">
          감정 분석에 실패했어요
        </Text>
        <Pressable
          onPress={onRetry}
          className="rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1.5 self-start active:opacity-70"
          accessibilityLabel="감정 분석 재시도"
          accessibilityRole="button">
          <Text className="text-sm text-stone-600 dark:text-stone-300">다시 시도하기</Text>
        </Pressable>
      </View>
    );
  }

  // 6. done이지만 감정 없음 (글이 너무 짧은 경우 등)
  return null;
}
