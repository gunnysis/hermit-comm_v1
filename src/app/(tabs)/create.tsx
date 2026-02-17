import React, { useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Container } from '@/shared/components/Container';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { api } from '@/shared/lib/api';
import { useAuthor } from '@/features/posts/hooks/useAuthor';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';

const createPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(100, '제목은 100자 이내로 입력해주세요.'),
  content: z
    .string()
    .min(1, '내용을 입력해주세요.')
    .max(5000, '내용은 5000자 이내로 입력해주세요.'),
  author: z
    .string()
    .min(1, '작성자 이름을 입력해주세요.')
    .max(50, '작성자 이름은 50자 이내로 입력해주세요.'),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

export default function CreateScreen() {
  const router = useRouter();
  const { author: savedAuthor, setAuthor: saveAuthor } = useAuthor();
  const insets = useSafeAreaInsets();
  const { isWide } = useResponsiveLayout();

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
      await api.createPost({
        title: data.title.trim(),
        content: data.content.trim(),
        author: data.author.trim(),
      });

      if (data.author.trim() !== (savedAuthor ?? '')) {
        await saveAuthor(data.author.trim());
      }

      Alert.alert('성공', '게시글이 작성되었습니다! 🎉', [
        {
          text: '확인',
          onPress: () => router.push('/(tabs)'),
        },
      ]);
    } catch (error) {
      Alert.alert('오류', '게시글 작성에 실패했습니다.');
      console.error('게시글 작성 실패:', error);
    }
  };

  return (
    <Container>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 48 : 0}>
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
                <Input
                  label="내용"
                  value={value}
                  onChangeText={onChange}
                  placeholder="이야기를 들려주세요 💭"
                  error={errors.content?.message}
                  multiline
                  numberOfLines={10}
                  className="h-48"
                  style={{ textAlignVertical: 'top' }}
                  maxLength={5000}
                />
              )}
            />

            <Controller
              control={control}
              name="author"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="작성자"
                  value={value}
                  onChangeText={onChange}
                  placeholder="이름을 입력하세요 👤"
                  error={errors.author?.message}
                  maxLength={50}
                />
              )}
            />
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
