import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Reaction } from '@/types';

export const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: '좋아요' },
  { type: 'heart', emoji: '❤️', label: '하트' },
  { type: 'laugh', emoji: '😂', label: '웃음' },
  { type: 'sad', emoji: '😢', label: '슬픔' },
  { type: 'surprise', emoji: '😮', label: '놀람' },
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

/** 개별 반응 버튼 — 누를 때 짧은 확대 애니메이션 */
function ReactionButton({
  type,
  emoji,
  label,
  count,
  loading,
  onPress,
}: {
  type: string;
  emoji: string;
  label: string;
  count: number;
  loading: boolean;
  onPress: (type: string) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 누름 시 잠깐 확대 후 복귀하는 애니메이션
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress(type);
  }, [loading, type, onPress, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        disabled={loading}
        className="flex-row items-center px-4 py-2 rounded-full bg-white dark:bg-stone-800 border-2 border-cream-300 dark:border-stone-600 active:opacity-80"
        accessibilityLabel={`${label} ${count}개, 누르면 추가`}
        accessibilityRole="button">
        <Text className="text-xl mr-1.5">{emoji}</Text>
        <Text className="text-sm font-semibold text-gray-700 dark:text-stone-200">{count}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ReactionBar({ reactions, onReaction, loading = false }: ReactionBarProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {REACTION_TYPES.map(({ type, emoji, label }) => (
        <ReactionButton
          key={type}
          type={type}
          emoji={emoji}
          label={label}
          count={getCount(reactions, type)}
          loading={loading}
          onPress={onReaction}
        />
      ))}
    </View>
  );
}
