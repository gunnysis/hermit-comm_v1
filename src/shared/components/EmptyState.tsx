import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="p-8 items-center" accessibilityLabel={title} accessibilityLiveRegion="polite">
      <Text className="text-5xl mb-3">{icon}</Text>
      <Text className="text-base font-semibold text-gray-800 dark:text-stone-100 text-center mb-1">
        {title}
      </Text>
      {description ? (
        <Text className="text-sm text-gray-500 dark:text-stone-400 text-center mb-4">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="py-3 px-6 rounded-xl bg-happy-400 active:opacity-80"
          accessibilityLabel={actionLabel}
          accessibilityRole="button">
          <Text className="text-base font-semibold text-happy-700">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
