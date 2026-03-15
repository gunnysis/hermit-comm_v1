import React, { useState } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTodayDaily } from '@/features/my/hooks/useTodayDaily';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { EMOTION_EMOJI, SHARED_PALETTE } from '@/shared/lib/constants';

const DISMISS_KEY = 'daily_banner_dismissed';

export function HomeCheckinBanner() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  const { data: todayDaily } = useTodayDaily(!!user);
  const [dismissed, setDismissed] = useState(false);

  // Check if dismissed today
  React.useEffect(() => {
    AsyncStorage.getItem(DISMISS_KEY).then((val) => {
      if (val === new Date().toISOString().slice(0, 10)) setDismissed(true);
    });
  }, []);

  if (!user || dismissed) return null;

  const handleDismiss = async () => {
    setDismissed(true);
    await AsyncStorage.setItem(DISMISS_KEY, new Date().toISOString().slice(0, 10));
  };

  // Already posted today
  if (todayDaily) {
    const emotions = todayDaily.emotions ?? todayDaily.initial_emotions ?? [];
    const likeCount = todayDaily.like_count ?? 0;
    return (
      <View
        className="mx-4 mb-3 rounded-xl px-4 py-3 flex-row items-center justify-between"
        style={{
          backgroundColor: isDark ? 'rgba(41,37,36,0.5)' : SHARED_PALETTE.cream[50],
          borderWidth: 1,
          borderColor: isDark ? 'rgba(68,64,60,0.4)' : SHARED_PALETTE.cream[200],
        }}>
        <Pressable
          onPress={() => router.push(`/post/${todayDaily.id}`)}
          className="flex-1 flex-row items-center">
          <Text className={`text-xs flex-1 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
            오늘의 하루: {emotions.map((e) => `${EMOTION_EMOJI[e] ?? ''} ${e}`).join(' ')}
          </Text>
          {likeCount > 0 && (
            <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              ❤️ {likeCount}명이 공감
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => router.push(`/create?type=daily&edit=${todayDaily.id}`)}
          className="ml-2 rounded-full px-2.5 py-1"
          style={{
            backgroundColor: isDark ? 'rgba(68,64,60,0.6)' : SHARED_PALETTE.cream[200],
          }}>
          <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>수정</Text>
        </Pressable>
      </View>
    );
  }

  // Not posted yet
  return (
    <View
      className="mx-4 mb-3 rounded-xl px-4 py-3 flex-row items-center justify-between"
      style={{
        backgroundColor: isDark ? 'rgba(41,37,36,0.5)' : SHARED_PALETTE.cream[50],
        borderWidth: 1,
        borderColor: isDark ? 'rgba(68,64,60,0.4)' : SHARED_PALETTE.cream[200],
      }}>
      <Text className={`text-xs ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
        오늘은 어떤 하루예요?
      </Text>
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => router.push('/create?type=daily')}
          className="rounded-full px-3 py-1.5"
          style={{ backgroundColor: SHARED_PALETTE.happy[500] }}>
          <Text className="text-xs font-semibold" style={{ color: '#1c1917' }}>
            나눠볼까요?
          </Text>
        </Pressable>
        <Pressable onPress={handleDismiss}>
          <Text className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            괜찮아요
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
