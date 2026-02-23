import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { AnonMode } from '@/types';

interface AnonModeInfoProps {
  anonMode: AnonMode;
  showName: boolean;
  onToggle: () => void;
}

/**
 * 게시판 익명 모드에 따라 알림 문구 또는 닉네임 공개 토글을 렌더링.
 */
export function AnonModeInfo({ anonMode, showName, onToggle }: AnonModeInfoProps) {
  if (anonMode === 'always_anon') {
    return (
      <Text className="text-xs text-gray-500">이 게시판의 글은 항상 익명으로 표시됩니다.</Text>
    );
  }

  if (anonMode === 'require_name') {
    return <Text className="text-xs text-gray-500">이 게시판의 글은 닉네임으로 표시됩니다.</Text>;
  }

  return (
    <Pressable onPress={onToggle} className="flex-row items-center gap-2 py-1 active:opacity-80">
      <View
        className={`w-4 h-4 rounded border ${
          showName ? 'bg-happy-400 border-happy-400' : 'border-cream-400'
        }`}
      />
      <Text className="text-xs text-gray-600">이번 글에 내 닉네임을 함께 표시하기</Text>
    </Pressable>
  );
}
