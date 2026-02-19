import { useAuth } from '@/features/auth/hooks/useAuth';
import { useGroupBoards } from '@/features/community/hooks/useGroupBoards';
import { createBoardPost } from '@/features/community/api/communityApi';
import { Button } from '@/shared/components/Button';
import { Container } from '@/shared/components/Container';
import { Input } from '@/shared/components/Input';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { resolveDisplayName } from '@/shared/lib/anonymous';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(100, '제목은 100자 이내로 입력해주세요.'),
  content: z
    .string()
    .min(1, '내용을 입력해주세요.')
    .max(5000, '내용은 5000자 이내로 입력해주세요.'),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

export default function GroupCreatePostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { groupId: groupIdParam, boardId: boardIdParam } = useLocalSearchParams<{
    groupId: string;
    boardId: string;
  }>();

  const groupId = useMemo(() => Number(groupIdParam), [groupIdParam]);
  const boardIdFromParam = useMemo(
    () => (boardIdParam ? Number(boardIdParam) : null),
    [boardIdParam],
  );

  const { data: boards } = useGroupBoards(Number.isNaN(groupId) ? null : groupId);
  const board = boards && boards.length > 0 ? boards[0] : null;
  const boardId = boardIdFromParam ?? board?.id ?? null;
  const anonMode = board?.anon_mode ?? 'always_anon';

  const [showName, setShowName] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { title: '', content: '' },
  });

  const onSubmit = async (data: CreatePostForm) => {
    if (!boardId || Number.isNaN(groupId)) {
      Alert.alert('오류', '게시판 정보를 불러오지 못했습니다.');
      return;
    }

    try {
      const { isAnonymous, displayName } = resolveDisplayName({
        anonMode,
        rawAuthorName: '',
        userId: user?.id ?? null,
        boardId,
        groupId,
        wantNameOverride: showName,
      });

      await createBoardPost({
        title: data.title.trim(),
        content: data.content.trim(),
        author: '',
        boardId,
        groupId,
        isAnonymous,
        displayName,
      });

      queryClient.invalidateQueries({ queryKey: ['groupPosts', groupId, boardId] });

      Alert.alert('완료', '게시글이 작성되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : '게시글 작성에 실패했습니다.';
      Alert.alert('오류', msg);
    }
  };

  return (
    <Container>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 48 : 0}>
        <ScreenHeader
          title="그룹 글쓰기"
          subtitle={board?.name ?? '그룹 게시판'}
          showBack
          backLabel="← 취소"
        />

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 16 }}>
          <View className="p-4 pb-2">
            <Controller
              control={control}
              name="title"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="제목"
                  value={value}
                  onChangeText={onChange}
                  placeholder="제목을 입력하세요"
                  error={errors.title?.message}
                  maxLength={100}
                />
              )}
            />

            <Controller
              control={control}
              name="content"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="내용"
                  value={value}
                  onChangeText={onChange}
                  placeholder="이야기를 들려주세요"
                  error={errors.content?.message}
                  multiline
                  numberOfLines={10}
                  className="h-48"
                  style={{ textAlignVertical: 'top' }}
                  maxLength={5000}
                />
              )}
            />

            <View className="mt-2 mb-2">
              {anonMode === 'always_anon' ? (
                <Text className="text-xs text-gray-500">
                  이 게시판의 글은 항상 익명으로 표시됩니다.
                </Text>
              ) : anonMode === 'allow_choice' ? (
                <Pressable
                  onPress={() => setShowName((prev) => !prev)}
                  className="flex-row items-center gap-2 py-1 active:opacity-80">
                  <View
                    className={`w-4 h-4 rounded border ${
                      showName ? 'bg-happy-400 border-happy-400' : 'border-cream-400'
                    }`}
                  />
                  <Text className="text-xs text-gray-600">
                    이번 글에 내 닉네임을 함께 표시하기
                  </Text>
                </Pressable>
              ) : (
                <Text className="text-xs text-gray-500">
                  이 게시판의 글은 닉네임으로 표시됩니다.
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        <View className="px-4 pb-4 pt-2 bg-cream-50 border-t border-cream-200">
          <Button
            title="작성하기"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            accessibilityLabel="게시글 작성하기"
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
