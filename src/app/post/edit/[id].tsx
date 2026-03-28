import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Container } from '@/shared/components/primitives/Container';
import { Loading } from '@/shared/components/primitives/Loading';
import { ErrorView } from '@/shared/components/composed/ErrorView';
import { Input } from '@/shared/components/primitives/Input';
import { ContentEditor } from '@/shared/components/composed/ContentEditor';
import { Button } from '@/shared/components/primitives/Button';
import { ScreenHeader } from '@/shared/components/composed/ScreenHeader';
import { api } from '@/shared/lib/api';
import { toFriendlyErrorMessage } from '@/shared/lib/errors';
import { usePostDetail } from '@/features/posts/hooks/usePostDetail';
import { useBoards } from '@/features/boards/hooks/useBoards';
import { validatePostTitle, validatePostContent } from '@/shared/utils/validate';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ title: '', content: '' });

  const postId = Number(id);
  const {
    data: post,
    isLoading: fetchLoading,
    error: fetchError,
    refetch,
  } = usePostDetail(Number.isNaN(postId) ? null : postId);

  const boardId = post?.board_id ?? null;

  const { data: publicBoards } = useBoards();

  const board = useMemo(() => {
    if (!boardId) return null;
    if (publicBoards) {
      return publicBoards.find((b) => b.id === boardId) ?? null;
    }
    return null;
  }, [boardId, publicBoards]);

  const anonMode = board?.anon_mode ?? 'always_anon';

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
    }
  }, [post]);

  const handleSubmit = async () => {
    const titleValidation = validatePostTitle(title);
    const contentValidation = validatePostContent(content);

    if (!titleValidation.isValid || !contentValidation.isValid) {
      setErrors({
        title: titleValidation.error || '',
        content: contentValidation.error || '',
      });
      return;
    }

    setErrors({ title: '', content: '' });

    try {
      setLoading(true);

      await api.updatePost(Number(id), {
        title: title.trim(),
        content: content.trim(),
      });

      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: ['boardPosts', boardId] });
      }

      Alert.alert('완료', '게시글이 수정되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('오류', toFriendlyErrorMessage(e, '게시글 수정에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Container>
        <StatusBar style="auto" />
        <Loading message="게시글을 불러오는 중..." />
      </Container>
    );
  }

  if (fetchError || !post) {
    return (
      <Container>
        <StatusBar style="auto" />
        <ErrorView
          message={(fetchError as Error)?.message ?? '게시글을 찾을 수 없습니다.'}
          onRetry={refetch}
        />
      </Container>
    );
  }

  return (
    <Container>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 48 : insets.top}>
        <ScreenHeader
          title="게시글 수정"
          subtitle={board?.name ?? '공개 게시판'}
          showBack
          backLabel="← 취소"
        />

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 16 }}>
          <View className="p-4 pb-2">
            <Input
              label="제목"
              value={title}
              onChangeText={setTitle}
              placeholder="제목을 입력하세요"
              error={errors.title}
              maxLength={100}
            />
            <Text
              className={`text-xs text-right mt-0.5 mb-2 ${
                title.length > 90 ? 'text-amber-500' : 'text-gray-400 dark:text-stone-500'
              }`}>
              {title.length}/100
            </Text>
            <ContentEditor
              key={`edit-${postId}-${content ? 'loaded' : 'init'}`}
              label="내용"
              value={content}
              onChange={setContent}
              placeholder="이야기를 들려주세요"
              error={errors.content}
              maxLength={5000}
              accessibilityLabel="본문"
            />

            <View className="mt-2 mb-2">
              {anonMode === 'always_anon' ? (
                <Text className="text-xs text-gray-500 dark:text-stone-400">
                  이 게시판의 글은 항상 익명으로 표시됩니다.
                </Text>
              ) : anonMode === 'require_name' ? (
                <Text className="text-xs text-gray-500 dark:text-stone-400">
                  이 게시판의 글은 닉네임으로 표시됩니다.
                </Text>
              ) : (
                <Text className="text-xs text-gray-500 dark:text-stone-400">
                  표시명은 게시판 설정에 따라 자동으로 결정됩니다.
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        <View className="px-4 pb-4 pt-2 bg-cream-50 dark:bg-stone-900 border-t border-cream-200 dark:border-stone-700">
          <Button
            title="저장하기"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            accessibilityLabel="게시글 저장"
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
