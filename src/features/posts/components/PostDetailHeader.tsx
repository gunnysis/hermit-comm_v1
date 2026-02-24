import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

interface PostDetailHeaderProps {
  onShare: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canDelete: boolean;
  /** 넓은 화면일 때 상단 패딩 축소 */
  isWide?: boolean;
}

export function PostDetailHeader({
  onShare,
  onEdit,
  onDelete,
  canDelete,
  isWide,
}: PostDetailHeaderProps) {
  const router = useRouter();

  return (
    <View
      className={`flex-row justify-between items-center px-4 pb-4 bg-lavender-100 dark:bg-stone-900 border-b border-cream-200 dark:border-stone-700 shadow-sm ${isWide ? 'pt-4' : 'pt-12'}`}>
      <Pressable
        onPress={() => router.back()}
        className="p-2 active:opacity-70"
        accessibilityLabel="뒤로 가기"
        accessibilityHint="이전 화면으로 돌아갑니다"
        accessibilityRole="button">
        <Text className="text-base text-happy-700 dark:text-happy-400 font-semibold">← 뒤로</Text>
      </Pressable>
      <View className="flex-row gap-2 items-center">
        <Pressable
          onPress={onShare}
          className="p-2 active:opacity-70"
          accessibilityLabel="공유"
          accessibilityHint="이 게시글 링크를 공유합니다"
          accessibilityRole="button">
          <Text className="text-base text-happy-700 dark:text-happy-400 font-semibold">공유</Text>
        </Pressable>
        {canDelete && onEdit && (
          <Pressable
            onPress={onEdit}
            className="p-2 active:opacity-70"
            accessibilityLabel="게시글 수정"
            accessibilityHint="이 게시글을 수정합니다"
            accessibilityRole="button">
            <Text className="text-base text-happy-700 dark:text-happy-400 font-semibold">수정</Text>
          </Pressable>
        )}
        {canDelete && onDelete && (
          <Pressable
            onPress={onDelete}
            className="p-2 active:opacity-70"
            accessibilityLabel="게시글 삭제"
            accessibilityHint="이 게시글을 삭제합니다"
            accessibilityRole="button">
            <Text className="text-base text-coral-500 font-semibold">삭제</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
