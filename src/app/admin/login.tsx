import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { replaceAdmin } from '@/shared/lib/navigation';
import { Container } from '@/shared/components/Container';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { auth } from '@/features/auth/auth';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useIsAdmin } from '@/features/admin/hooks/useIsAdmin';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function AdminLoginScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    setError(null);
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    if (!trimmedPassword) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await auth.signInWithPassword(trimmedEmail, trimmedPassword);
      replaceAdmin(router);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : '로그인에 실패했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [email, password, router]);

  const handleCancel = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);

  // 이미 로그인된 관리자면 /admin으로 (훅 호출 순서 유지를 위해 useEffect 사용)
  useEffect(() => {
    if (user && isAdmin === true && !isAdminLoading) {
      replaceAdmin(router);
    }
  }, [user, isAdmin, isAdminLoading, router]);

  if (user && isAdmin === true && !isAdminLoading) {
    return null;
  }

  return (
    <Container>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled">
          <Text className="text-2xl font-bold text-gray-800 dark:text-stone-100 mb-2">
            관리자 로그인
          </Text>
          <Text className="text-sm text-gray-600 dark:text-stone-400 mb-6">
            이메일과 비밀번호로 로그인하면 관리자 페이지에 접근할 수 있습니다.
          </Text>

          <Input
            label="이메일"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
            placeholder="admin@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="비밀번호"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            placeholder="비밀번호"
            secureTextEntry
            autoComplete="password"
          />

          {error ? (
            <View className="mb-4 p-3 bg-coral-50 dark:bg-coral-900/30 rounded-xl">
              <Text className="text-sm text-coral-600 dark:text-coral-400">{error}</Text>
            </View>
          ) : null}

          <Button
            title="로그인"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
          />

          <Pressable onPress={handleCancel} className="mt-4 py-3" accessibilityLabel="취소">
            <Text className="text-center text-gray-600 dark:text-stone-400">취소</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}
