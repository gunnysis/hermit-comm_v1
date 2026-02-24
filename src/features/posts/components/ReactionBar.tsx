import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Reaction } from '@/types';
import { formatReactionCount } from '@/shared/utils/format';

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
  userReactedTypes: string[];
  onReaction: (reactionType: string) => void;
  pendingTypes?: Set<string>;
}

function getCount(reactions: Reaction[], type: string): number {
  const r = reactions.find((x) => x.reaction_type === type);
  return r?.count ?? 0;
}

/** 개별 반응 버튼 — 누를 때 짧은 확대 애니메이션, 활성/비활성 스타일, 44pt 최소 터치 영역 */
function ReactionButton({
  type,
  emoji,
  label,
  count,
  isActive,
  isPending,
  onPress,
}: {
  type: string;
  emoji: string;
  label: string;
  count: number;
  isActive: boolean;
  isPending: boolean;
  onPress: (type: string) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    if (isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    onPress(type);
  }, [isPending, type, onPress, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        disabled={isPending}
        className={[
          'flex-row items-center min-h-[44px] px-4 py-2.5 rounded-full border-2 active:opacity-80',
          isActive
            ? 'bg-happy-100 dark:bg-happy-900/40 border-happy-400'
            : 'bg-white dark:bg-stone-800 border-cream-300 dark:border-stone-600',
          isPending ? 'opacity-60' : '',
        ].join(' ')}
        accessibilityLabel={`${label} ${count}개, ${isActive ? '누르면 취소' : '누르면 추가'}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive, disabled: isPending }}>
        <Text className="text-xl mr-2">{emoji}</Text>
        <Text
          className={[
            'text-sm font-semibold tabular-nums',
            isActive ? 'text-happy-700 dark:text-happy-300' : 'text-gray-700 dark:text-stone-200',
          ].join(' ')}>
          {formatReactionCount(count)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function ReactionBar({
  reactions,
  userReactedTypes,
  onReaction,
  pendingTypes = new Set(),
}: ReactionBarProps) {
  const sortedTypes = useMemo(() => {
    return [...REACTION_TYPES].sort((a, b) => {
      const countA = getCount(reactions, a.type);
      const countB = getCount(reactions, b.type);
      if (countA > 0 && countB === 0) return -1;
      if (countA === 0 && countB > 0) return 1;
      return countB - countA;
    });
  }, [reactions]);

  return (
    <View className="flex-row flex-wrap gap-3" accessibilityLabel="반응 버튼 목록">
      {sortedTypes.map(({ type, emoji, label }) => (
        <ReactionButton
          key={type}
          type={type}
          emoji={emoji}
          label={label}
          count={getCount(reactions, type)}
          isActive={userReactedTypes.includes(type)}
          isPending={pendingTypes.has(type)}
          onPress={onReaction}
        />
      ))}
    </View>
  );
}
