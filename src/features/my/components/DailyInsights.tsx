import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { useDailyInsights } from '../hooks/useDailyInsights';
import {
  ACTIVITY_PRESETS,
  EMOTION_EMOJI,
  EMOTION_COLOR_MAP,
  DAILY_INSIGHTS_CONFIG,
} from '@/shared/lib/constants';

export function DailyInsights({ enabled = true }: { enabled?: boolean }) {
  const isDark = useColorScheme() === 'dark';
  const { data, isLoading } = useDailyInsights(30, enabled);

  if (isLoading || !data) return null;

  const { total_dailies, activity_emotion_map } = data;

  const getActivityLabel = (id: string) => {
    const preset = ACTIVITY_PRESETS.find((p) => p.id === id);
    return preset ? `${preset.icon} ${preset.name}` : id;
  };

  // Not enough data
  if (total_dailies < DAILY_INSIGHTS_CONFIG.MIN_DAILIES_FOR_INSIGHTS) {
    return (
      <View className="mb-4">
        <Text
          className={`text-sm font-semibold mb-2 ${isDark ? 'text-stone-100' : 'text-gray-800'}`}>
          나의 패턴
        </Text>
        <View className={`rounded-xl px-4 py-4 ${isDark ? 'bg-stone-800' : 'bg-stone-50'}`}>
          <Text className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            아직 패턴을 찾고 있어요.
          </Text>
          <Text className={`text-xs mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            하루를 나눌수록 더 잘 보여요 :) ({total_dailies}/
            {DAILY_INSIGHTS_CONFIG.MIN_DAILIES_FOR_INSIGHTS}일)
          </Text>
          {/* Progress bar */}
          <View className={`mt-2 h-1.5 rounded-full ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`}>
            <View
              className="h-1.5 rounded-full bg-happy-400"
              style={{
                width: `${Math.min((total_dailies / DAILY_INSIGHTS_CONFIG.MIN_DAILIES_FOR_INSIGHTS) * 100, 100)}%`,
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  // No activity data despite enough dailies
  if (!activity_emotion_map || activity_emotion_map.length === 0) return null;

  // Find top insight for message
  const topActivity = activity_emotion_map[0];
  const topEmotion = topActivity?.emotions?.[0];

  return (
    <View className="mb-4">
      <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-stone-100' : 'text-gray-800'}`}>
        나의 패턴 (최근 30일)
      </Text>

      {activity_emotion_map.map((item) => (
        <View key={item.activity} className="mb-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className={`text-xs font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
              {getActivityLabel(item.activity)} ({item.count}회)
            </Text>
          </View>
          {/* Emotion bar */}
          <View
            className={`h-5 rounded-full overflow-hidden flex-row ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`}>
            {item.emotions.map((em) => {
              const colors = EMOTION_COLOR_MAP[em.emotion];
              return (
                <View
                  key={em.emotion}
                  style={{
                    width: `${em.pct}%`,
                    backgroundColor: colors?.gradient[0] ?? '#E7D7FF',
                  }}
                  className="h-full justify-center items-center">
                  {em.pct >= 25 && (
                    <Text style={{ fontSize: 9, color: isDark ? '#fff' : '#1c1917' }}>
                      {EMOTION_EMOJI[em.emotion]} {em.pct}%
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ))}

      {/* Insight message */}
      {topActivity && topEmotion && (
        <View className={`rounded-xl px-3 py-2 mt-1 ${isDark ? 'bg-stone-800' : 'bg-stone-50'}`}>
          <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {getActivityLabel(topActivity.activity).replace(/^[^\s]+ /, '')}한 날에{' '}
            {topEmotion.emotion}을 자주 느끼는 경향이 있어요.
          </Text>
        </View>
      )}
    </View>
  );
}
