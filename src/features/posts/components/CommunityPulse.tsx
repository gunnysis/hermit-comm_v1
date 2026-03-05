import React, { useMemo, useCallback, useRef } from 'react';
import { View, Text, Pressable, Animated, useColorScheme } from 'react-native';
import { EMOTION_EMOJI, EMOTION_COLOR_MAP } from '@/shared/lib/constants';
import type { EmotionTrend } from '@/types';

interface CommunityPulseProps {
  trends: EmotionTrend[];
  onEmotionSelect?: (emotion: string) => void;
  selectedEmotion?: string | null;
}

function Bubble({
  emotion,
  size,
  isSelected,
  onPress,
}: {
  emotion: string;
  size: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colors = EMOTION_COLOR_MAP[emotion];

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.15,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [onPress, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPress={handlePress} accessibilityLabel={`${emotion} 감정 필터`}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors?.gradient[0] ?? '#F3EBFF',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? '#666' : 'transparent',
          }}>
          <Text className="text-sm">{EMOTION_EMOJI[emotion] ?? '💬'}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function CommunityPulse({ trends, onEmotionSelect, selectedEmotion }: CommunityPulseProps) {
  const isDark = useColorScheme() === 'dark';

  const bubbles = useMemo(() => {
    if (!trends.length) return [];
    const maxPct = Math.max(...trends.map((t) => t.pct ?? 0));
    return trends.slice(0, 8).map((t) => ({
      ...t,
      size: Math.max(36, Math.min(72, ((t.pct ?? 0) / (maxPct || 1)) * 72)),
    }));
  }, [trends]);

  if (!bubbles.length) return null;

  return (
    <View className="mb-3">
      <Text
        className={`text-xs font-semibold mb-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
        커뮤니티 감정
      </Text>
      <View className="flex-row flex-wrap gap-2 items-end">
        {bubbles.map((b) => (
          <Bubble
            key={b.emotion}
            emotion={b.emotion}
            size={b.size}
            isSelected={selectedEmotion === b.emotion}
            onPress={() => onEmotionSelect?.(b.emotion)}
          />
        ))}
      </View>
    </View>
  );
}
