import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, Animated, useColorScheme } from 'react-native';
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

/** 리액션 타입별 활성 색상 */
const ACTIVE_COLORS: Record<string, { bg: string; border: string; text: string; shadow: string }> =
  {
    like: {
      bg: 'bg-happy-100 dark:bg-happy-900/50',
      border: 'border-happy-400 dark:border-happy-500',
      text: 'text-happy-700 dark:text-happy-300',
      shadow: '#FFCF33',
    },
    heart: {
      bg: 'bg-coral-50 dark:bg-coral-900/40',
      border: 'border-coral-400 dark:border-coral-500',
      text: 'text-coral-600 dark:text-coral-400',
      shadow: '#FF7366',
    },
    laugh: {
      bg: 'bg-peach-50 dark:bg-peach-900/40',
      border: 'border-peach-400 dark:border-peach-500',
      text: 'text-peach-700 dark:text-peach-400',
      shadow: '#FFAF66',
    },
    sad: {
      bg: 'bg-lavender-50 dark:bg-lavender-900/40',
      border: 'border-lavender-400 dark:border-lavender-500',
      text: 'text-lavender-700 dark:text-lavender-400',
      shadow: '#C39BFF',
    },
    surprise: {
      bg: 'bg-mint-50 dark:bg-mint-900/40',
      border: 'border-mint-400 dark:border-mint-600',
      text: 'text-mint-700 dark:text-mint-400',
      shadow: '#19FFB2',
    },
  };

const DEFAULT_ACTIVE = ACTIVE_COLORS.like;

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

/** 총 리액션 수 */
function getTotalCount(reactions: Reaction[]): number {
  return reactions.reduce((sum, r) => sum + r.count, 0);
}

/** 개별 반응 칩 버튼 — 스프링 바운스 애니메이션, 글로우 이펙트, 44pt 최소 터치 영역 */
function ReactionChip({
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = ACTIVE_COLORS[type] ?? DEFAULT_ACTIVE;

  const handlePress = useCallback(() => {
    if (isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(scaleAnim, {
      toValue: 1.15,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }).start();
    });

    onPress(type);
  }, [isPending, type, onPress, scaleAnim]);

  const hasCount = count > 0;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        disabled={isPending}
        style={
          isActive
            ? {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.5 : 0.35,
                shadowRadius: 8,
                elevation: 6,
              }
            : {
                shadowColor: isDark ? '#000' : '#9CA3AF',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.3 : 0.12,
                shadowRadius: 3,
                elevation: 2,
              }
        }
        className={[
          'flex-row items-center min-h-[40px] px-3.5 py-2 rounded-2xl border-[1.5px]',
          isActive
            ? `${colors.bg} ${colors.border}`
            : isDark
              ? 'bg-stone-800/80 border-stone-600/60'
              : 'bg-white/90 border-stone-200/80',
          isPending ? 'opacity-50' : '',
        ].join(' ')}
        accessibilityLabel={`${label} ${count}개, ${isActive ? '누르면 취소' : '누르면 추가'}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive, disabled: isPending }}>
        <Text className={`mr-1.5 ${hasCount ? 'text-lg' : 'text-base'}`}>{emoji}</Text>
        {hasCount && (
          <Text
            className={[
              'text-[13px] font-bold tabular-nums',
              isActive ? colors.text : isDark ? 'text-stone-300' : 'text-stone-600',
            ].join(' ')}>
            {formatReactionCount(count)}
          </Text>
        )}
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
  const totalCount = getTotalCount(reactions);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
    <View accessibilityLabel="반응 버튼 목록">
      {/* 총 리액션 수 + 레이블 */}
      <View className="flex-row items-center mb-3">
        <Text
          className={`text-xs font-semibold tracking-wide uppercase ${
            isDark ? 'text-stone-400' : 'text-stone-500'
          }`}>
          반응
        </Text>
        {totalCount > 0 && (
          <View
            className={`ml-2 px-2 py-0.5 rounded-full ${
              isDark ? 'bg-stone-700/60' : 'bg-stone-100'
            }`}>
            <Text
              className={`text-[11px] font-bold tabular-nums ${
                isDark ? 'text-stone-300' : 'text-stone-500'
              }`}>
              {formatReactionCount(totalCount)}
            </Text>
          </View>
        )}
      </View>

      {/* 리액션 칩 그리드 */}
      <View className="flex-row flex-wrap gap-2">
        {sortedTypes.map(({ type, emoji, label }) => (
          <ReactionChip
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
    </View>
  );
}
