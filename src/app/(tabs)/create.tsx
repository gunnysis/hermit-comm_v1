import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Controller } from 'react-hook-form';
import { Container } from '@/shared/components/Container';
import { Input } from '@/shared/components/Input';
import { ContentEditor } from '@/shared/components/ContentEditor';
import { ImagePicker } from '@/features/posts/components/ImagePicker';
import { Button } from '@/shared/components/Button';
import { AnonModeInfo } from '@/features/posts/components/AnonModeInfo';
import { useCreatePost } from '@/features/posts/hooks/useCreatePost';
import { useAuthor } from '@/features/posts/hooks/useAuthor';
import { useDraft } from '@/features/posts/hooks/useDraft';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { useBoards } from '@/features/community/hooks/useBoards';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DEFAULT_PUBLIC_BOARD_ID } from '@/shared/lib/constants';
import { pushTabs } from '@/shared/lib/navigation';
import Toast from 'react-native-toast-message';

export default function CreateScreen() {
  const router = useRouter();
  const { author: savedAuthor, setAuthor: saveAuthor } = useAuthor();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { isWide } = useResponsiveLayout();
  const { data: boards } = useBoards();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const board = boards?.find((b) => b.id === DEFAULT_PUBLIC_BOARD_ID);
  const anonMode = board?.anon_mode ?? 'always_anon';

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    handleContentChange,
    errors,
    isSubmitting,
    showName,
    setShowName,
    onSubmit: handleFormSubmit,
  } = useCreatePost({
    boardId: DEFAULT_PUBLIC_BOARD_ID,
    user,
    anonMode,
    defaultValues: { author: savedAuthor ?? '' },
    getExtraPostData: () => ({ image_url: imageUrl ?? undefined }),
    onSuccess: async (data) => {
      const rawAuthor = data.author?.trim() ?? '';
      if (rawAuthor && rawAuthor !== (savedAuthor ?? '')) {
        await saveAuthor(rawAuthor);
      }
      clearDraft();
      Toast.show({ type: 'success', text1: '게시글이 작성되었습니다. ✓' });
      pushTabs(router);
    },
    onError: (message) => Alert.alert('오류', message),
  });

  const watched = watch();
  const { loadDraft, clearDraft } = useDraft(DEFAULT_PUBLIC_BOARD_ID, {
    title: watched.title ?? '',
    content: watched.content ?? '',
    author: watched.author ?? '',
  });

  useEffect(() => {
    if (savedAuthor) setValue('author', savedAuthor);
  }, [savedAuthor, setValue]);

  const draftCheckedRef = React.useRef(false);
  useEffect(() => {
    if (draftCheckedRef.current) return;
    draftCheckedRef.current = true;
    const draft = loadDraft();
    if (!draft) return;
    Alert.alert('임시저장된 글', '임시저장된 글이 있습니다. 복원할까요?', [
      { text: '취소', style: 'cancel', onPress: () => clearDraft() },
      {
        text: '복원',
        onPress: () => {
          setValue('title', draft.title);
          setValue('content', draft.content);
          setValue('author', draft.author);
        },
      },
    ]);
  }, [loadDraft, clearDraft, setValue]);

  return (
    <Container>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? insets.top + (isWide ? 0 : 48) : insets.top
        }>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 16 }}>
          <View
            className={`bg-peach-100 dark:bg-stone-900 px-4 ${isWide ? 'pt-6' : 'pt-12'} pb-6 border-b border-cream-200 dark:border-stone-700`}>
            <View className="flex-row items-center">
              <Text className="text-3xl mr-2">✍️</Text>
              <Text className="text-3xl font-bold text-gray-800 dark:text-stone-100">
                게시글 작성
              </Text>
            </View>
            <Text className="text-sm text-gray-600 dark:text-stone-400 mt-2">
              따뜻한 이야기를 나눠주세요
            </Text>
            {board?.description ? (
              <Text className="text-xs text-gray-500 dark:text-stone-400 mt-1" numberOfLines={2}>
                {board.description}
              </Text>
            ) : null}
          </View>

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
                  placeholder="멋진 제목을 입력하세요 ✨"
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
                  placeholder="이야기를 들려주세요 💭"
                  error={errors.content?.message}
                  maxLength={5000}
                  accessibilityLabel="본문"
                  accessibilityHint="리치 텍스트로 내용을 입력합니다"
                />
              )}
            />

            <Controller
              control={control}
              name="author"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="닉네임 (선택)"
                  value={value}
                  onChangeText={onChange}
                  placeholder="닉네임을 입력하면 다음에도 기억해둘게요 👤"
                  error={errors.author?.message}
                  maxLength={50}
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

        <View className="px-4 pb-4 pt-2 bg-cream-50 dark:bg-stone-900 border-t border-cream-200 dark:border-stone-700">
          <Button
            title="작성하기 🎨"
            onPress={handleSubmit(handleFormSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            accessibilityLabel="게시글 작성하기"
            accessibilityHint="입력한 제목과 내용으로 게시글을 등록합니다"
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
