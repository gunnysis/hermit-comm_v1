import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Reaction } from '@/types';

export const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: '좋아요' },
  { type: 'heart', emoji: '❤️', label: '하트' },
  { type: 'laugh', emoji: '😂', label: '웃음' },
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number]['type'];

interface ReactionBarProps {
  reactions: Reaction[];
  onReaction: (reactionType: string) => void;
  loading?: boolean;
}

function getCount(reactions: Reaction[], type: string): number {
  const r = reactions.find((x) => x.reaction_type === type);
  return r?.count ?? 0;
}

export function ReactionBar({ reactions, onReaction, loading = false }: ReactionBarProps) {
  const handlePress = (type: string) => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReaction(type);
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {REACTION_TYPES.map(({ type, emoji, label }) => (
        <Pressable
          key={type}
          onPress={() => handlePress(type)}
          disabled={loading}
          className="flex-row items-center px-4 py-2 rounded-full bg-white border-2 border-cream-300 active:opacity-80 active:scale-95"
          accessibilityLabel={`${label} ${getCount(reactions, type)}개, 누르면 추가`}
          accessibilityRole="button">
          <Text className="text-xl mr-1.5">{emoji}</Text>
          <Text className="text-sm font-semibold text-gray-700">{getCount(reactions, type)}</Text>
        </Pressable>
      ))}
    </View>
  );
}
