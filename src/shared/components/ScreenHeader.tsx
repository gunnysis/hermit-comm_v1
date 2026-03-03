import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable, Animated, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backLabel?: string;
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  backLabel,
  rightContent,
  children,
}: ScreenHeaderProps) {
  const router = useRouter();
  const { isWide } = useResponsiveLayout();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backScale = useRef(new Animated.Value(1)).current;

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(backScale, { toValue: 0.9, duration: 60, useNativeDriver: true }),
      Animated.spring(backScale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();
    router.back();
  }, [router, backScale]);

  return (
    <BlurView
      intensity={isDark ? 30 : 50}
      tint={isDark ? 'dark' : 'light'}
      className={`px-4 ${isWide ? 'pt-5' : 'pt-12'} pb-5 border-b ${
        isDark ? 'border-stone-800/60' : 'border-cream-200/60'
      }`}>
      {showBack && (
        <Animated.View style={{ transform: [{ scale: backScale }] }} className="mb-3">
          <Pressable
            onPress={handleBack}
            className="flex-row items-center self-start -ml-1 p-1 rounded-lg active:bg-stone-200/30 dark:active:bg-stone-700/30"
            accessibilityLabel="뒤로 가기"
            accessibilityRole="button">
            <Ionicons name="chevron-back" size={20} color={isDark ? '#FFDB66' : '#997500'} />
            {backLabel && (
              <Text className="text-sm text-happy-700 dark:text-happy-300 font-semibold ml-0.5">
                {backLabel}
              </Text>
            )}
          </Pressable>
        </Animated.View>
      )}
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-gray-800 dark:text-stone-100 tracking-tight">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-sm text-gray-500 dark:text-stone-400 mt-1">{subtitle}</Text>
          )}
        </View>
        {rightContent}
      </View>
      {children}
    </BlurView>
  );
}
