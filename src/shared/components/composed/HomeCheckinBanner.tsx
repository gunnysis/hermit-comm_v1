import React, { useState } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTodayDaily } from '@/features/my/hooks/useTodayDaily';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { EMOTION_EMOJI, SHARED_PALETTE } from '@/shared/lib/constants';

interface HomeCheckinBannerProps {
  onCreatePress?: () => void;
}

export function HomeCheckinBanner({ onCreatePress }: HomeCheckinBannerProps = {}) {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  const { data: todayDaily } = useTodayDaily(!!user);
  const [dismissed, setDismissed] = useState(false);

  // 사용자별 dismiss 키 (공유 기기 대응)
  const dismissKey = user ? `daily_banner_dismissed_${user.id}` : 'daily_banner_dismissed';

  React.useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem(dismissKey).then((val) => {
      if (val === new Date().toISOString().slice(0, 10)) setDismissed(true);
    });
  }, [user, dismissKey]);

  // BottomSheet等で記録後、バナーを自動リセット
  React.useEffect(() => {
    if (todayDaily && dismissed) {
      AsyncStorage.removeItem(dismissKey);
      setDismissed(false);
    }
  }, [todayDaily, dismissed, dismissKey]);

  if (!user || dismissed) return null;

  const handleDismiss = async () => {
    setDismissed(true);
    await AsyncStorage.setItem(dismissKey, new Date().toISOString().slice(0, 10));
  };

  // Already posted today
  if (todayDaily) {
    const emotions = todayDaily.emotions ?? todayDaily.initial_emotions ?? [];
    const likeCount = todayDaily.like_count ?? 0;
    const commentCount = todayDaily.comment_count ?? 0;
    const hasReactions = likeCount > 0 || commentCount > 0;
    return (
      <View
        className="mx-4 mb-3 rounded-xl px-4 py-3"
        style={{
          backgroundColor: isDark ? 'rgba(41,37,36,0.5)' : SHARED_PALETTE.cream[50],
          borderWidth: 1,
          borderColor: isDark ? 'rgba(68,64,60,0.4)' : SHARED_PALETTE.cream[200],
        }}
        accessibilityLabel={`오늘의 하루 - ${emotions[0] ?? ''}, 좋아요 ${likeCount}개, 댓글 ${commentCount}개`}>
        <Pressable
          onPress={() => router.push(`/post/${todayDaily.id}`)}
          className="flex-row items-center">
          <Text
            className={`text-xs flex-1 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}
            numberOfLines={1}>
            오늘의 하루: {emotions.map((e) => `${EMOTION_EMOJI[e] ?? ''} ${e}`).join(' ')}
          </Text>
          <Pressable
            onPress={() => router.push(`/create?type=daily&edit=${todayDaily.id}`)}
            className="ml-2 rounded-full px-2.5 py-1"
            style={{
              backgroundColor: isDark ? 'rgba(68,64,60,0.6)' : SHARED_PALETTE.cream[200],
            }}>
            <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>수정</Text>
          </Pressable>
        </Pressable>
        {hasReactions && (
          <View className="flex-row items-center gap-3 mt-1.5">
            {likeCount > 0 && (
              <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                ❤️ {likeCount}명이 공감
              </Text>
            )}
            {commentCount > 0 && (
              <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                💬 {commentCount}개 댓글
              </Text>
            )}
          </View>
        )}
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
          onPress={() => (onCreatePress ? onCreatePress() : router.push('/create?type=daily'))}
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
