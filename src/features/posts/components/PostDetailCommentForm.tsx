import React from 'react';
import { View, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <BlurView
      intensity={isDark ? 40 : 60}
      tint={isDark ? 'dark' : 'light'}
      className={`border-t ${isDark ? 'border-stone-800/60' : 'border-stone-200/60'}`}>
      <View className="flex-row items-end gap-2 px-4 py-3">
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
    </BlurView>
  );
}
