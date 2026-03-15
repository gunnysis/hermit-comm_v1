import React, { useState, useEffect } from 'react';
import { Text, Pressable, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { api } from '@/shared/lib/api';
import { SHARED_PALETTE } from '@/shared/lib/constants';

const SEEN_KEY = 'yesterday_reaction_seen';

export function YesterdayReactionBanner() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  const [seen, setSeen] = useState(true); // default hidden until checked

  const { data } = useQuery({
    queryKey: ['yesterdayDailyReactions'],
    queryFn: api.getYesterdayDailyReactions,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    AsyncStorage.getItem(SEEN_KEY).then((val) => {
      const today = new Date().toISOString().slice(0, 10);
      setSeen(val === today);
    });
  }, []);

  if (!user || seen || !data) return null;

  const handlePress = async () => {
    setSeen(true);
    await AsyncStorage.setItem(SEEN_KEY, new Date().toISOString().slice(0, 10));
    router.push(`/post/${data.post_id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="mx-4 mb-3 rounded-xl px-4 py-3 flex-row items-center justify-between"
      style={{
        backgroundColor: isDark ? 'rgba(41,37,36,0.5)' : SHARED_PALETTE.cream[50],
        borderWidth: 1,
        borderColor: isDark ? 'rgba(68,64,60,0.4)' : SHARED_PALETTE.cream[200],
      }}>
      <Text className={`text-xs flex-1 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
        어제 나눈 하루에 {data.like_count}명이 공감했어요
        {data.comment_count > 0 ? ` · 💬 ${data.comment_count}개` : ''}
      </Text>
      <Text className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
        보러가기
      </Text>
    </Pressable>
  );
}
