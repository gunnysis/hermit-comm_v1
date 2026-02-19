import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-6 right-6 w-14 h-14 bg-[#FFC300] rounded-full items-center justify-center shadow-lg active:scale-95"
      style={{ elevation: 5 }}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button">
      <Ionicons name={icon} size={24} color="#1F2937" />
    </Pressable>
  );
}
