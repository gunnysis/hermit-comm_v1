import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, Animated, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Reaction } from '@/types';
import { formatReactionCount } from '@/shared/utils/format';
import { REACTION_COLOR_MAP, SHARED_PALETTE } from '@/shared/lib/constants';

export const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: '좋아요' },
  { type: 'heart', emoji: '❤️', label: '하트' },
  { type: 'laugh', emoji: '😂', label: '웃음' },
  { type: 'sad', emoji: '😢', label: '슬픔' },
  { type: 'surprise', emoji: '😮', label: '놀람' },
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number]['type'];

/** SHARED_PALETTE + REACTION_COLOR_MAP 기반 Tailwind 클래스·그림자 색상 생성 */
function buildActiveColors(colorKey: string) {
  const palette = SHARED_PALETTE[colorKey as keyof typeof SHARED_PALETTE];
  if (!palette) return buildActiveColors('happy');
  return {
    bg: `bg-${colorKey}-100 dark:bg-${colorKey}-900/50`,
    border: `border-${colorKey}-400 dark:border-${colorKey}-500`,
    text: `text-${colorKey}-700 dark:text-${colorKey}-300`,
    shadow: palette[400],
  };
}

const ACTIVE_COLORS: Record<string, { bg: string; border: string; text: string; shadow: string }> =
  Object.fromEntries(
    Object.entries(REACTION_COLOR_MAP).map(([type, colorKey]) => [
      type,
      buildActiveColors(colorKey),
    ]),
  );

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

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const handlePress = useCallback(() => {
    if (isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 타입별 차별화된 애니메이션
    switch (type) {
      case 'heart':
        // pulse: 1 → 1.3 → 0.9 → 1
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.3,
            friction: 3,
            tension: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 0.9,
            friction: 4,
            tension: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 120,
            useNativeDriver: true,
          }),
        ]).start();
        break;
      case 'laugh':
        // wiggle rotation
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: -12, duration: 80, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 12, duration: 80, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.1,
            friction: 3,
            tension: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 120,
            useNativeDriver: true,
          }),
        ]).start();
        break;
      case 'sad':
        // droop: 살짝 아래로
        Animated.sequence([
          Animated.timing(translateYAnim, { toValue: 3, duration: 150, useNativeDriver: true }),
          Animated.spring(translateYAnim, {
            toValue: 0,
            friction: 5,
            tension: 120,
            useNativeDriver: true,
          }),
        ]).start();
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.05,
            friction: 4,
            tension: 150,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 120,
            useNativeDriver: true,
          }),
        ]).start();
        break;
      case 'surprise':
        // pop: 0.5 → 1.2 → 1
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 0.5, duration: 50, useNativeDriver: true }),
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            friction: 3,
            tension: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 120,
            useNativeDriver: true,
          }),
        ]).start();
        break;
      default:
        // like: standard bounce
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.15,
            friction: 3,
            tension: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 120,
            useNativeDriver: true,
          }),
        ]).start();
    }

    onPress(type);
  }, [isPending, type, onPress, scaleAnim, rotateAnim, translateYAnim]);

  const hasCount = count > 0;

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          {
            rotate: rotateAnim.interpolate({
              inputRange: [-12, 12],
              outputRange: ['-12deg', '12deg'],
            }),
          },
          { translateY: translateYAnim },
        ],
      }}>
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
