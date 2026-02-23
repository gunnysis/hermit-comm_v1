import { useAuth } from '@/features/auth/hooks/useAuth';
import { useGroupBoards } from '@/features/community/hooks/useGroupBoards';
import { useCreatePost } from '@/features/posts/hooks/useCreatePost';
import { AnonModeInfo } from '@/features/posts/components/AnonModeInfo';
import { ImagePicker } from '@/features/posts/components/ImagePicker';
import { Button } from '@/shared/components/Button';
import { Container } from '@/shared/components/Container';
import { Input } from '@/shared/components/Input';
import { ContentEditor } from '@/shared/components/ContentEditor';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GroupCreatePostScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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

  const {
    control,
    handleSubmit,
    handleContentChange,
    errors,
    isSubmitting,
    showName,
    setShowName,
    onSubmit: handleFormSubmit,
  } = useCreatePost({
    boardId,
    groupId,
    user,
    anonMode,
    getExtraPostData: () => ({ image_url: imageUrl ?? undefined }),
    onSuccess: () => {
      Alert.alert('완료', '게시글이 작성되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    },
    onError: (message) => Alert.alert('오류', message),
  });

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
            <ImagePicker
              imageUrl={imageUrl}
              onImageUrlChange={setImageUrl}
              disabled={isSubmitting}
            />
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
              render={({ field: { value } }) => (
                <ContentEditor
                  label="내용"
                  value={value}
                  onChange={handleContentChange}
                  placeholder="이야기를 들려주세요"
                  error={errors.content?.message}
                  maxLength={5000}
                  accessibilityLabel="본문"
                />
              )}
            />

            <View className="mt-2 mb-2">
              <AnonModeInfo
                anonMode={anonMode}
                showName={showName}
                onToggle={() => setShowName((prev) => !prev)}
              />
            </View>
          </View>
        </ScrollView>

        <View className="px-4 pb-4 pt-2 bg-cream-50 border-t border-cream-200">
          <Button
            title="작성하기"
            onPress={handleSubmit(handleFormSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            accessibilityLabel="게시글 작성하기"
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
