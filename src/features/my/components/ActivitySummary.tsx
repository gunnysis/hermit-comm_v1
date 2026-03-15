import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { useActivitySummary } from '../hooks/useActivitySummary';
import { Skeleton } from '@/shared/components/Skeleton';

interface StatItemProps {
  emoji: string;
  label: string;
  value: string | number;
  isDark: boolean;
}

function StatItem({ emoji, label, value, isDark }: StatItemProps) {
  return (
    <View
      className={`flex-1 items-center py-3 px-2 rounded-xl ${
        isDark ? 'bg-stone-800' : 'bg-stone-50'
      }`}>
      <Text className="text-lg">{emoji}</Text>
      <Text className={`text-lg font-bold mt-0.5 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
        {value}
      </Text>
      <Text className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
        {label}
      </Text>
    </View>
  );
}

export function ActivitySummary({ enabled = true }: { enabled?: boolean }) {
  const isDark = useColorScheme() === 'dark';
  const { data: summary, isLoading } = useActivitySummary(enabled);

  if (isLoading) {
    return (
      <View className="flex-row gap-2 mb-4">
        {[0, 1, 2, 3].map((i) => (
          <View key={i} className="flex-1 items-center py-3 px-2 rounded-xl">
            <Skeleton className="w-12 h-12" />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row gap-2 mb-4">
      <StatItem emoji="📝" label="작성한 글" value={summary?.post_count ?? 0} isDark={isDark} />
      <StatItem emoji="💬" label="댓글" value={summary?.comment_count ?? 0} isDark={isDark} />
      <StatItem emoji="💛" label="반응" value={summary?.reaction_count ?? 0} isDark={isDark} />
      <StatItem emoji="🔥" label="연속" value={`${summary?.streak ?? 0}일`} isDark={isDark} />
    </View>
  );
}
