import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
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
  backLabel = '← 뒤로',
  rightContent,
  children,
}: ScreenHeaderProps) {
  const router = useRouter();
  const { isWide } = useResponsiveLayout();

  return (
    <View
      className={`bg-happy-100 dark:bg-stone-900 px-4 ${isWide ? 'pt-6' : 'pt-12'} pb-6 border-b border-cream-200 dark:border-stone-700 shadow-sm`}>
      {showBack && (
        <Pressable
          onPress={() => router.back()}
          className="p-1 -ml-1 mb-2 active:opacity-70"
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button">
          <Text className="text-sm text-happy-700 dark:text-happy-400 font-semibold">
            {backLabel}
          </Text>
        </Pressable>
      )}
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-gray-800 dark:text-stone-100">{title}</Text>
          {subtitle && (
            <Text className="text-sm text-gray-600 dark:text-stone-400 mt-1">{subtitle}</Text>
          )}
        </View>
        {rightContent}
      </View>
      {children}
    </View>
  );
}
