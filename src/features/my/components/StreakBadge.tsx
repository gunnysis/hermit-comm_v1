import React, { useEffect, useRef } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Skeleton } from '@/shared/components/primitives/Skeleton';
import { useStreak } from '../hooks/useStreak';

const MILESTONES = [
  { days: 7, emoji: '🌱', label: '새싹' },
  { days: 14, emoji: '🌿', label: '잎사귀' },
  { days: 30, emoji: '🌳', label: '나무' },
  { days: 50, emoji: '🌲', label: '큰 나무' },
  { days: 100, emoji: '🏔️', label: '산' },
];

interface StreakBadgeProps {
  enabled?: boolean;
}

export function StreakBadge({ enabled = true }: StreakBadgeProps) {
  const isDark = useColorScheme() === 'dark';
  const { data } = useStreak(enabled);
  const celebratedRef = useRef(false);
  const scale = useSharedValue(1);

  // 마일스톤 달성 축하
  useEffect(() => {
    if (data?.new_milestone && data.new_milestone > 0 && !celebratedRef.current) {
      celebratedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 150 }),
      );
    }
  }, [data?.new_milestone, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!data) {
    return (
      <View className={`mx-0 mt-3 rounded-2xl p-4 ${isDark ? 'bg-stone-800/50' : 'bg-cream-50'}`}
        style={{ borderWidth: 1, borderColor: isDark ? 'rgba(68,64,60,0.4)' : '#E8DCC8' }}>
        <View className="flex-row items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <View>
            <Skeleton className="w-28 h-4 mb-1" />
            <Skeleton className="w-16 h-3" />
          </View>
        </View>
      </View>
    );
  }

  const currentMilestone = MILESTONES.filter((m) => data.current_streak >= m.days).pop();
  const nextMilestone = MILESTONES.find((m) => data.current_streak < m.days);

  return (
    <Animated.View entering={FadeIn.duration(300)} style={animStyle}>
      <View
        className={`rounded-2xl p-3 ${isDark ? 'bg-stone-800/50' : 'bg-cream-50'}`}
        style={{
          borderWidth: 1,
          borderColor: isDark ? 'rgba(68,64,60,0.4)' : '#E8DCC8',
        }}>
        {/* 메인 스트릭 */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg">{currentMilestone?.emoji ?? '✨'}</Text>
            <View>
              <Text className={`text-sm font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                {data.current_streak > 0
                  ? `${data.current_streak}일 연속 기록`
                  : data.completed_today
                    ? '오늘 기록 완료'
                    : data.total_days > 0
                      ? '오늘도 이어가볼까요?'
                      : '첫 하루를 나눠보세요'}
              </Text>
              <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                총 {data.total_days}일 기록
              </Text>
            </View>
          </View>
          {data.completed_today && <Text className="text-xs text-happy-600">✓ 완료</Text>}
        </View>

        {/* 다음 마일스톤 진행률 */}
        {nextMilestone && data.current_streak > 0 && (
          <View>
            <View className="flex-row justify-between mb-1">
              <Text className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                다음: {nextMilestone.emoji} {nextMilestone.label} ({nextMilestone.days}일)
              </Text>
              <Text className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                {data.current_streak}/{nextMilestone.days}
              </Text>
            </View>
            <View className={`h-1.5 rounded-full ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`}>
              <View
                className="h-1.5 rounded-full bg-happy-400"
                style={{
                  width: `${Math.min((data.current_streak / nextMilestone.days) * 100, 100)}%`,
                }}
              />
            </View>
          </View>
        )}

        {/* 마일스톤 달성 축하 */}
        {data.new_milestone > 0 && (
          <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700">
            <Text
              className={`text-xs text-center font-medium ${isDark ? 'text-happy-300' : 'text-happy-700'}`}>
              🎉 {data.new_milestone}일 연속 달성!
            </Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}
