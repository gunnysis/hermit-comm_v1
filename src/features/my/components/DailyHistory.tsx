import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { EMOTION_EMOJI } from '@/shared/lib/constants';
import { useDailyHistory } from '../hooks/useDailyHistory';
import { Skeleton } from '@/shared/components/primitives/Skeleton';

interface DailyHistoryProps {
  enabled?: boolean;
}

export function DailyHistory({ enabled = true }: DailyHistoryProps) {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { data: items = [], isLoading } = useDailyHistory(10, enabled);

  if (isLoading) {
    return (
      <View
        className={`mx-0 mt-4 rounded-2xl p-4 ${isDark ? 'bg-stone-800/50' : 'bg-cream-50'}`}
        style={{ borderWidth: 1, borderColor: isDark ? 'rgba(68,64,60,0.4)' : '#E8DCC8' }}>
        <Skeleton className="w-28 h-5 mb-3" />
        <Skeleton className="w-full h-12 mb-2 rounded-xl" />
        <Skeleton className="w-full h-12 rounded-xl" />
      </View>
    );
  }

  if (items.length === 0) return null;

  return (
    <View
      className={`mt-4 rounded-2xl p-4 ${isDark ? 'bg-stone-800/50' : 'bg-cream-50'}`}
      style={{ borderWidth: 1, borderColor: isDark ? 'rgba(68,64,60,0.4)' : '#E8DCC8' }}>
      <Text
        className={`text-sm font-semibold mb-3 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
        📖 나의 기록
      </Text>

      {items.slice(0, 7).map((item) => (
        <Pressable
          key={item.id}
          onPress={() => router.push(`/post/${item.id}`)}
          className={`rounded-xl px-3 py-2.5 mb-1.5 ${isDark ? 'bg-stone-700/50' : 'bg-white'}`}
          accessibilityLabel={`${item.created_date_kst} 기록 보기`}
          accessibilityRole="button">
          <View className="flex-row items-center justify-between">
            <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {item.created_date_kst}
            </Text>
            <View className="flex-row items-center gap-2">
              {item.like_count > 0 && (
                <Text className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  ❤️ {item.like_count}
                </Text>
              )}
              {item.comment_count > 0 && (
                <Text className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  💬 {item.comment_count}
                </Text>
              )}
            </View>
          </View>
          <View className="flex-row flex-wrap gap-1 mt-1">
            {(item.emotions ?? []).map((e) => (
              <Text key={e} className="text-xs">
                {EMOTION_EMOJI[e]} {e}
              </Text>
            ))}
          </View>
          {item.content ? (
            <Text
              numberOfLines={1}
              className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {item.content}
            </Text>
          ) : null}
        </Pressable>
      ))}

      {items.length > 7 && (
        <Text
          className={`text-xs text-center mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
          +{items.length - 7}개 더
        </Text>
      )}
    </View>
  );
}
