import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';

interface PostDetailCommentFormProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
  replyTo?: string | null;
  onCancelReply?: () => void;
}

export function PostDetailCommentForm({
  value,
  onChangeText,
  onSubmit,
  loading,
  disabled,
  replyTo,
  onCancelReply,
}: PostDetailCommentFormProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <BlurView
      intensity={isDark ? 40 : 60}
      tint={isDark ? 'dark' : 'light'}
      className={`border-t ${isDark ? 'border-stone-800/60' : 'border-stone-200/60'}`}>
      {replyTo && (
        <View className="flex-row items-center justify-between px-4 pt-2">
          <Text className="text-xs text-gray-500 dark:text-stone-400">
            {replyTo}님에게 답글 작성 중
          </Text>
          <Pressable onPress={onCancelReply} className="p-1">
            <Ionicons name="close" size={16} color={isDark ? '#78716c' : '#9CA3AF'} />
          </Pressable>
        </View>
      )}
      <View className="flex-row items-end gap-2 px-4 py-3">
        <View className="flex-1">
          <Input
            value={value}
            onChangeText={onChangeText}
            placeholder={replyTo ? '답글을 입력하세요' : '댓글을 입력하세요'}
            multiline
            maxLength={1000}
            className="max-h-24 mb-0"
            accessibilityLabel={replyTo ? '답글 입력' : '댓글 입력'}
            accessibilityHint={
              replyTo
                ? '답글을 입력한 뒤 작성 버튼을 누르세요'
                : '댓글을 입력한 뒤 작성 버튼을 누르세요'
            }
          />
        </View>
        <Button
          title="작성"
          onPress={onSubmit}
          loading={loading}
          disabled={disabled}
          size="sm"
          accessibilityLabel={replyTo ? '답글 작성' : '댓글 작성'}
          accessibilityHint={replyTo ? '입력한 답글을 등록합니다' : '입력한 댓글을 등록합니다'}
        />
      </View>
    </BlurView>
  );
}
