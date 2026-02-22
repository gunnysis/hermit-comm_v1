import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useIsAdmin } from '@/features/admin/hooks/useIsAdmin';
import { auth } from '@/features/auth/auth';

export default function AdminLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();

  const isLoginScreen = segments[segments.length - 1] === 'login';

  useEffect(() => {
    if (authLoading) return;

    if (isLoginScreen) {
      // 로그인 화면: 이미 관리자로 로그인된 경우 /admin으로
      if (user && isAdmin === true && !isAdminLoading) {
        router.replace('/admin' as Parameters<typeof router.replace>[0]);
      }
      return;
    }

    // 관리자 홈 등: 로그인 필요
    if (!user) {
      router.replace('/admin/login' as Parameters<typeof router.replace>[0]);
      return;
    }

    if (isAdminLoading) return;

    if (isAdmin === false) {
      // 권한 없음: 로그아웃 후 탭으로
      (async () => {
        await auth.signOut();
        await auth.signInAnonymously();
        router.replace('/(tabs)');
      })();
    }
  }, [authLoading, user, isAdmin, isAdminLoading, isLoginScreen, router]);

  // 로그인 화면은 별도 처리 없이 Stack에 맡김 (login.tsx에서 이미 관리자면 replace 처리)
  if (isLoginScreen) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="index" />
      </Stack>
    );
  }

  // 관리자 영역: 인증 로딩
  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream-50">
        <ActivityIndicator size="large" color="#FFC300" />
        <Text className="mt-4 text-base text-gray-600">확인 중...</Text>
      </View>
    );
  }

  // 로그인 안 됨 → replace 처리됨, 잠깐 빈 화면 가능
  if (!user) {
    return null;
  }

  // 관리자 여부 조회 중
  if (isAdminLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream-50">
        <ActivityIndicator size="large" color="#FFC300" />
        <Text className="mt-4 text-base text-gray-600">권한 확인 중...</Text>
      </View>
    );
  }

  // 권한 없음 → useEffect에서 signOut + replace 처리
  if (isAdmin === false) {
    return (
      <View className="flex-1 items-center justify-center bg-cream-50">
        <Text className="text-base text-gray-600">권한이 없습니다.</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />
    </Stack>
  );
}
