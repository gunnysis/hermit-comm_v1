import React from 'react';
import { View } from 'react-native';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';

interface PostDetailCommentFormProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
}

export function PostDetailCommentForm({
  value,
  onChangeText,
  onSubmit,
  loading,
  disabled,
}: PostDetailCommentFormProps) {
  return (
    <View className="flex-row items-end gap-2 px-4 py-3 bg-white dark:bg-stone-900 border-t border-cream-200 dark:border-stone-700 shadow-lg">
      <View className="flex-1">
        <Input
          value={value}
          onChangeText={onChangeText}
          placeholder="댓글을 입력하세요"
          multiline
          maxLength={1000}
          className="max-h-24 mb-0"
          accessibilityLabel="댓글 입력"
          accessibilityHint="댓글을 입력한 뒤 작성 버튼을 누르세요"
        />
      </View>
      <Button
        title="작성"
        onPress={onSubmit}
        loading={loading}
        disabled={disabled}
        size="sm"
        accessibilityLabel="댓글 작성"
        accessibilityHint="입력한 댓글을 등록합니다"
      />
    </View>
  );
}
