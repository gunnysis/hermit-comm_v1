import React, { useMemo } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { useMyAlias } from '../hooks/useMyAlias';
import { useActivitySummary } from '../hooks/useActivitySummary';
import { useTodayDaily } from '../hooks/useTodayDaily';
import { EMOTION_EMOJI, EMOTION_COLOR_MAP } from '@/shared/lib/constants';
import { Skeleton } from '@/shared/components/primitives/Skeleton';
import type { User } from '@supabase/supabase-js';

function getDaysSince(dateStr: string): number {
  const created = new Date(dateStr);
  const now = new Date();
  return Math.max(1, Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
}

export function ProfileSection({ user }: { user: User }) {
  const isDark = useColorScheme() === 'dark';
  const { data: alias, isLoading: aliasLoading } = useMyAlias(true);
  const { data: summary, isLoading: summaryLoading } = useActivitySummary(true);
  const { data: todayDaily } = useTodayDaily(true);

  const daysSince = useMemo(() => getDaysSince(user.created_at), [user.created_at]);
  const streak = summary?.streak ?? 0;

  const todayEmotions: string[] = useMemo(() => {
    if (!todayDaily) return [];
    return Array.isArray(todayDaily.emotions) ? todayDaily.emotions : [];
  }, [todayDaily]);

  return (
    <View
      className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-stone-800' : 'bg-stone-50'}`}
      style={{
        borderWidth: 1,
        borderColor: isDark ? '#44403c' : '#e7e5e4',
      }}>
      {/* Alias + Member Since */}
      <View className="flex-row items-center gap-3 mb-3">
        <View
          className={`w-11 h-11 rounded-full items-center justify-center ${isDark ? 'bg-stone-700' : 'bg-white'}`}
          style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          {aliasLoading ? (
            <Skeleton className="w-11 h-11 rounded-full" />
          ) : (
            <Text style={{ fontSize: 20 }}>🙂</Text>
          )}
        </View>
        <View className="flex-1">
          {aliasLoading ? (
            <Skeleton className="w-24 h-5" />
          ) : (
            <Text className={`text-base font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
              {alias ?? '익명'}
            </Text>
          )}
          <Text className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            함께한 지 {daysSince}일째
          </Text>
        </View>
      </View>

      {/* Streak + Today's Emotion */}
      <View className="flex-row items-center gap-2 flex-wrap">
        {summaryLoading ? (
          <Skeleton className="w-28 h-6 rounded-full" />
        ) : streak > 0 ? (
          <View className={`rounded-full px-3 py-1 ${isDark ? 'bg-stone-700' : 'bg-white'}`}>
            <Text className={`text-xs font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
              🔥 연속 {streak}일 기록 중
            </Text>
          </View>
        ) : (
          <View className={`rounded-full px-3 py-1 ${isDark ? 'bg-stone-700' : 'bg-white'}`}>
            <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              오늘 하루를 나눠보세요
            </Text>
          </View>
        )}

        {todayEmotions.map((emotion) => {
          const color = EMOTION_COLOR_MAP[emotion];
          return (
            <View
              key={emotion}
              className="rounded-full px-2 py-0.5 flex-row items-center gap-0.5"
              style={{ backgroundColor: color?.gradient[0] ?? '#f5f5f4' }}>
              <Text style={{ fontSize: 10 }}>
                {EMOTION_EMOJI[emotion]} {emotion}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
