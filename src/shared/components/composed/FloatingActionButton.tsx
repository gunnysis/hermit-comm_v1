import React, { useCallback, useRef, useEffect } from 'react';
import { Pressable, Animated, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useTabBarHeight } from '@/shared/hooks/useTabBarHeight';
import { MOTION } from '@/shared/lib/constants';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
}

export function FloatingActionButton({
  onPress,
  icon = 'pencil',
  accessibilityLabel = '새 글 작성',
}: FloatingActionButtonProps) {
  const { fabIcon } = useThemeColors();
  const tabBarHeight = useTabBarHeight();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  // 등장 애니메이션
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...MOTION.spring.fab,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 0.88,
      ...MOTION.spring.button,
      useNativeDriver: true,
    }).start();
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [pressScale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  const combinedScale = Animated.multiply(scaleAnim, pressScale);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        right: 20,
        bottom: tabBarHeight + 16,
        transform: [{ scale: combinedScale }],
        shadowColor: isDark ? '#FFC300' : '#997500',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.5 : 0.3,
        shadowRadius: 12,
        elevation: 8,
      }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="w-14 h-14 bg-happy-500 dark:bg-happy-500 rounded-2xl items-center justify-center"
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button">
        <Ionicons name={icon} size={22} color={fabIcon} />
      </Pressable>
    </Animated.View>
  );
}
