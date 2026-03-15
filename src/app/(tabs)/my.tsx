import React from 'react';
import { ScrollView, View, Text, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { ActivitySummary } from '@/features/my/components/ActivitySummary';
import { EmotionCalendar } from '@/features/posts/components/EmotionCalendar';
import { EmotionWaveNative } from '@/features/my/components/EmotionWaveNative';
import { DailyInsights } from '@/features/my/components/DailyInsights';
import { Loading } from '@/shared/components/Loading';

export default function MyScreen() {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className={`text-base text-center ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
          로그인이 필요해요
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? '#1c1917' : '#fff' }}>
      <ScreenHeader title="나" />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}>
        <View className="mt-4">
          <ActivitySummary enabled={!!user} />
        </View>

        <View className={`h-px my-3 ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />

        <DailyInsights enabled={!!user} />

        <EmotionCalendar userId={user.id} />

        <View className={`h-px my-3 ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />

        <EmotionWaveNative />
      </ScrollView>
    </View>
  );
}
