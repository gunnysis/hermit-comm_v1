import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

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
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      className="absolute right-6 w-14 h-14 bg-happy-500 dark:bg-happy-600 rounded-full items-center justify-center shadow-lg active:scale-95"
      style={{ elevation: 5, bottom: insets.bottom + 24 }}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button">
      <Ionicons name={icon} size={24} color={fabIcon} />
    </Pressable>
  );
}
