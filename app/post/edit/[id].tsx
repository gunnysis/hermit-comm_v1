import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Container } from '../../../components/common/Container';
import { Loading } from '../../../components/common/Loading';
import { ErrorView } from '../../../components/common/ErrorView';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { api } from '../../../lib/api';
import { useAPI } from '../../../hooks/useAPI';
import { useAuthor } from '../../../hooks/useAuthor';
import {
  validatePostTitle,
  validatePostContent,
  validateAuthor,
} from '../../../utils/validate';

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { author: savedAuthor, setAuthor: saveAuthor } = useAuthor();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState(savedAuthor);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ title: '', content: '', author: '' });

  const { data: post, loading: fetchLoading, error: fetchError, refetch } = useAPI(
    () => api.getPost(Number(id))
  );

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setAuthor(post.author);
    }
  }, [post]);

  const handleSubmit = async () => {
    const titleValidation = validatePostTitle(title);
    const contentValidation = validatePostContent(content);
    const authorValidation = validateAuthor(author);

    if (!titleValidation.isValid || !contentValidation.isValid || !authorValidation.isValid) {
      setErrors({
        title: titleValidation.error || '',
        content: contentValidation.error || '',
        author: authorValidation.error || '',
      });
      return;
    }

    setErrors({ title: '', content: '', author: '' });

    try {
      setLoading(true);
      await api.updatePost(Number(id), {
        title: title.trim(),
        content: content.trim(),
        author: author.trim(),
      });
      if (author !== savedAuthor) {
        await saveAuthor(author.trim());
      }
      Alert.alert('성공', '게시글이 수정되었습니다.', [
        { text: '확인', onPress: () => router.replace(`/post/${id}`) },
      ]);
    } catch (error) {
      Alert.alert('오류', '게시글 수정에 실패했습니다.');
      console.error('게시글 수정 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Container>
        <StatusBar style="dark" />
        <Loading message="게시글을 불러오는 중..." />
      </Container>
    );
  }

  if (fetchError || !post) {
    return (
      <Container>
        <StatusBar style="dark" />
        <ErrorView
          message={fetchError || '게시글을 찾을 수 없습니다.'}
          onRetry={refetch}
        />
      </Container>
    );
  }

  return (
    <Container>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-row justify-between items-center px-4 pt-12 pb-4 bg-lavender-100 border-b border-cream-200">
          <Pressable onPress={() => router.back()} className="p-2 active:opacity-70">
            <Text className="text-base text-happy-700 font-semibold">← 취소</Text>
          </Pressable>
          <Text className="text-lg font-bold text-gray-800">게시글 수정</Text>
          <View className="w-12" />
        </View>
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="p-4">
            <Input
              label="제목"
              value={title}
              onChangeText={setTitle}
              placeholder="멋진 제목을 입력하세요 ✨"
              error={errors.title}
              maxLength={100}
            />
            <Input
              label="내용"
              value={content}
              onChangeText={setContent}
              placeholder="이야기를 들려주세요 💭"
              error={errors.content}
              multiline
              numberOfLines={10}
              className="h-48"
              style={{ textAlignVertical: 'top' }}
              maxLength={5000}
            />
            <Input
              label="작성자"
              value={author}
              onChangeText={setAuthor}
              placeholder="이름을 입력하세요 👤"
              error={errors.author}
              maxLength={50}
            />
            <Button
              title="저장하기"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}
