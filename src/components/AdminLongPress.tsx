import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useIsAdmin } from '@/features/admin/hooks/useIsAdmin';
import { router } from 'expo-router';

interface Props {
  children: React.ReactNode;
}

export function AdminLongPress({ children }: Props) {
  const { isAdmin } = useIsAdmin();
  const scale = useSharedValue(1);

  const handleLongPress = useCallback(() => {
    if (!isAdmin) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withTiming(1, { duration: 120 }),
    );
    router.push('/admin');
  }, [isAdmin, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onLongPress={handleLongPress} delayLongPress={800}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}
