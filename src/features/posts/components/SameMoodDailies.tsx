import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { EMOTION_EMOJI } from '@/shared/lib/constants';

interface SameMoodDailiesProps {
  postId: number;
  emotions: string[];
  postType?: string;
}

export function SameMoodDailies({ postId, emotions, postType }: SameMoodDailiesProps) {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();

  const { data: dailies = [] } = useQuery({
    queryKey: ['sameMoodDailies', postId],
    queryFn: () => api.getSameMoodDailies(postId, emotions),
    enabled: postType === 'daily' && emotions.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  if (dailies.length === 0) return null;

  return (
    <View className="mt-4">
      <Text
        className={`text-sm font-semibold mb-2 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
        같은 마음의 하루
      </Text>
      {dailies.map((daily) => {
        const primaryEmotion = daily.emotions?.[0] ?? '';
        return (
          <Pressable
            key={daily.id}
            onPress={() => router.push(`/post/${daily.id}`)}
            className={`rounded-lg px-3 py-2 mb-1.5 ${isDark ? 'bg-stone-800' : 'bg-stone-50'}`}>
            <Text
              className={`text-xs ${isDark ? 'text-stone-300' : 'text-stone-600'}`}
              numberOfLines={1}>
              {EMOTION_EMOJI[primaryEmotion]}{' '}
              {daily.content ? `"${daily.content}"` : primaryEmotion}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
