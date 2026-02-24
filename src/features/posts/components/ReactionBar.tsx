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
  userReactedTypes: string[];
  onReaction: (reactionType: string) => void;
  pendingTypes?: Set<string>;
}

function getCount(reactions: Reaction[], type: string): number {
  const r = reactions.find((x) => x.reaction_type === type);
  return r?.count ?? 0;
}

export function ReactionBar({
  reactions,
  userReactedTypes,
  onReaction,
  pendingTypes = new Set(),
}: ReactionBarProps) {
  const handlePress = (type: string) => {
    if (pendingTypes.has(type)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReaction(type);
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {REACTION_TYPES.map(({ type, emoji, label }) => {
        const isActive = userReactedTypes.includes(type);
        const isPending = pendingTypes.has(type);

        return (
          <Pressable
            key={type}
            onPress={() => handlePress(type)}
            disabled={isPending}
            className={[
              'flex-row items-center px-4 py-2 rounded-full border-2 active:opacity-80 active:scale-95',
              isActive ? 'bg-happy-100 border-happy-400' : 'bg-white border-cream-300',
              isPending ? 'opacity-60' : '',
            ].join(' ')}
            accessibilityLabel={`${label} ${getCount(reactions, type)}개, ${isActive ? '누르면 취소' : '누르면 추가'}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive, disabled: isPending }}>
            <Text className="text-xl mr-1.5">{emoji}</Text>
            <Text
              className={[
                'text-sm font-semibold',
                isActive ? 'text-happy-700' : 'text-gray-700',
              ].join(' ')}>
              {getCount(reactions, type)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
