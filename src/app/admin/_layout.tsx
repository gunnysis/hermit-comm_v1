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

  // #region agent log
  if (typeof fetch === 'function') {
    const payload = {
      sessionId: 'd0d0af',
      runId: 'e2e-debug',
      hypothesisId: 'A',
      location: 'admin/_layout.tsx',
      message: 'admin layout state',
      data: {
        isLoginScreen,
        hasUser: !!user,
        isAdmin: isAdmin === true,
        authLoading,
        isAdminLoading,
        willRedirect: isLoginScreen && !!user && isAdmin === true && !isAdminLoading,
      },
      timestamp: Date.now(),
    };
    fetch('http://127.0.0.1:7253/ingest/90f7134e-6d97-4475-aa60-bbd05c5333c0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd0d0af' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
  // #endregion

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
    // #region agent log
    if (typeof fetch === 'function') {
      fetch('http://127.0.0.1:7253/ingest/90f7134e-6d97-4475-aa60-bbd05c5333c0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd0d0af' },
        body: JSON.stringify({
          sessionId: 'd0d0af',
          runId: 'e2e-debug',
          hypothesisId: 'B',
          location: 'admin/_layout.tsx',
          message: 'rendering login stack (login screen will show)',
          data: {},
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="index" />
      </Stack>
    );
  }

  // 관리자 영역: 인증 로딩
  if (authLoading) {
    // #region agent log
    if (typeof fetch === 'function') {
      fetch('http://127.0.0.1:7253/ingest/90f7134e-6d97-4475-aa60-bbd05c5333c0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd0d0af' },
        body: JSON.stringify({
          sessionId: 'd0d0af',
          runId: 'e2e-debug',
          hypothesisId: 'B',
          location: 'admin/_layout.tsx',
          message: 'showing auth loading (확인 중...)',
          data: {},
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
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
    // #region agent log
    if (typeof fetch === 'function') {
      fetch('http://127.0.0.1:7253/ingest/90f7134e-6d97-4475-aa60-bbd05c5333c0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd0d0af' },
        body: JSON.stringify({
          sessionId: 'd0d0af',
          runId: 'e2e-debug',
          hypothesisId: 'B',
          location: 'admin/_layout.tsx',
          message: 'showing isAdmin loading (권한 확인 중...)',
          data: {},
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
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
