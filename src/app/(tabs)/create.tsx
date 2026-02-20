import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Container } from '@/shared/components/Container';
import { Input } from '@/shared/components/Input';
import { ContentEditor } from '@/shared/components/ContentEditor';
import { Button } from '@/shared/components/Button';
import { api } from '@/shared/lib/api';
import { useAuthor } from '@/features/posts/hooks/useAuthor';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { useBoards } from '@/features/community/hooks/useBoards';
import { resolveDisplayName } from '@/shared/lib/anonymous';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

const createPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(100, '제목은 100자 이내로 입력해주세요.'),
  content: z
    .string()
    .min(1, '내용을 입력해주세요.')
    .max(5000, '내용은 5000자 이내로 입력해주세요.'),
  author: z.string().max(50, '작성자 이름은 50자 이내로 입력해주세요.').optional(),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

export default function CreateScreen() {
  const BOARD_ID = 1;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { author: savedAuthor, setAuthor: saveAuthor } = useAuthor();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { isWide } = useResponsiveLayout();
  const { data: boards } = useBoards();
  const [showName, setShowName] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: '',
      content: '',
      author: savedAuthor ?? '',
    },
  });

  useEffect(() => {
    if (savedAuthor) setValue('author', savedAuthor);
  }, [savedAuthor, setValue]);

  const onSubmit = async (data: CreatePostForm) => {
    try {
      const board = boards?.find((b) => b.id === BOARD_ID);
      const anonMode = board?.anon_mode ?? 'always_anon';

      const rawAuthor = data.author?.trim() ?? '';

      const { isAnonymous, displayName } = resolveDisplayName({
        anonMode,
        rawAuthorName: rawAuthor,
        userId: user?.id ?? null,
        boardId: BOARD_ID,
        wantNameOverride: showName,
      });

      await api.createPost({
        title: data.title.trim(),
        content: data.content.trim(),
        author: rawAuthor,
        board_id: BOARD_ID,
        is_anonymous: isAnonymous,
        display_name: displayName,
      });

      if (rawAuthor && rawAuthor !== (savedAuthor ?? '')) {
        await saveAuthor(rawAuthor);
      }

      queryClient.invalidateQueries({ queryKey: ['boardPosts', BOARD_ID] });

      Alert.alert('완료', '게시글이 작성되었습니다.', [
        {
          text: '확인',
          onPress: () => router.push('/(tabs)'),
        },
      ]);
    } catch {
      Alert.alert('오류', '게시글 작성에 실패했습니다.');
    }
  };

  return (
    <Container>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + (isWide ? 0 : 48) : 0}>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 16 }}>
          <View
            className={`bg-peach-100 px-4 ${isWide ? 'pt-6' : 'pt-12'} pb-6 border-b border-cream-200`}>
            <View className="flex-row items-center">
              <Text className="text-3xl mr-2">✍️</Text>
              <Text className="text-3xl font-bold text-gray-800">게시글 작성</Text>
            </View>
            <Text className="text-sm text-gray-600 mt-2">따뜻한 이야기를 나눠주세요</Text>
            {(() => {
              const board = boards?.find((b) => b.id === BOARD_ID);
              if (!board?.description) return null;
              return (
                <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
                  {board.description}
                </Text>
              );
            })()}
          </View>

          <View className="p-4 pb-2">
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
              render={({ field: { value, onChange } }) => (
                <ContentEditor
                  label="내용"
                  value={value}
                  onChange={onChange}
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
              {(() => {
                const board = boards?.find((b) => b.id === BOARD_ID);
                const anonMode = board?.anon_mode ?? 'always_anon';

                if (anonMode === 'always_anon') {
                  return (
                    <Text className="text-xs text-gray-500">
                      이 게시판의 글은 항상 익명으로 표시됩니다.
                    </Text>
                  );
                }

                if (anonMode === 'require_name') {
                  return (
                    <Text className="text-xs text-gray-500">
                      이 게시판의 글은 닉네임으로 표시됩니다. 작성자 이름을 입력해주세요.
                    </Text>
                  );
                }

                return (
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
                );
              })()}
            </View>
          </View>
        </ScrollView>

        <View className="px-4 pb-4 pt-2 bg-cream-50 border-t border-cream-200">
          <Button
            title="작성하기 🎨"
            onPress={handleSubmit(onSubmit)}
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
