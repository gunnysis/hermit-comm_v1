import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Container } from '../../components/common/Container';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { api } from '../../lib/api';
import { useAuthor } from '../../hooks/useAuthor';
import {
  validatePostTitle,
  validatePostContent,
  validateAuthor,
} from '../../utils/validate';

export default function CreateScreen() {
  const router = useRouter();
  const { author: savedAuthor, setAuthor: saveAuthor } = useAuthor();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState(savedAuthor);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    title: '',
    content: '',
    author: '',
  });

  const handleSubmit = async () => {
    // 입력 검증
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
      
      // 게시글 생성
      await api.createPost({
        title: title.trim(),
        content: content.trim(),
        author: author.trim(),
      });

      // 작성자 저장
      if (author !== savedAuthor) {
        await saveAuthor(author.trim());
      }

      // 성공 알림
      Alert.alert('성공', '게시글이 작성되었습니다! 🎉', [
        {
          text: '확인',
          onPress: () => {
            // 폼 초기화
            setTitle('');
            setContent('');
            // 홈 화면으로 이동
            router.push('/(tabs)');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('오류', '게시글 작성에 실패했습니다.');
      console.error('게시글 작성 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
        >
          {/* 행복한 헤더 */}
          <View className="bg-peach-100 px-4 pt-12 pb-6 border-b border-cream-200">
            <View className="flex-row items-center">
              <Text className="text-3xl mr-2">✍️</Text>
              <Text className="text-3xl font-bold text-gray-800">
                게시글 작성
              </Text>
            </View>
            <Text className="text-sm text-gray-600 mt-2">
              따뜻한 이야기를 나눠주세요
            </Text>
          </View>

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
              title="작성하기 🎨"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              accessibilityLabel="게시글 작성하기"
              accessibilityHint="입력한 제목과 내용으로 게시글을 등록합니다"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}
