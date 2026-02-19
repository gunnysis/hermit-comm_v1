import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { queryClient } from '@/shared/lib/queryClient';
import { AppErrorBoundary } from '@/shared/components/AppErrorBoundary';
import { NetworkBanner } from '@/shared/components/NetworkBanner';
import '@/global.css';

async function checkAndApplyUpdate() {
  if (__DEV__) return;
  try {
    const Updates = await import('expo-updates');
    if (typeof Updates.checkForUpdateAsync !== 'function') return;
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch {
    // 네트워크 오류 등 시 무시 (사용자 안내 없음)
  }
}

export default function RootLayout() {
  const { loading, error } = useAuth();

  // 앱 실행 시 1회만 OTA 업데이트 확인 후 자동 적용 (사용자 선택 없음)
  useEffect(() => {
    checkAndApplyUpdate();
  }, []);

  // 인증 초기화 중에는 로딩 표시
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream-50 p-5">
        <ActivityIndicator size="large" color="#FFC300" />
        <Text className="mt-4 text-base text-gray-600">인증 초기화 중...</Text>
      </View>
    );
  }

  // 인증 에러 발생 시 에러 화면 표시
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-cream-50 p-5">
        <Text className="text-6xl mb-4">😢</Text>
        <Text className="text-base text-coral-600 text-center mb-2">{error}</Text>
        <Text className="text-sm text-gray-500 text-center">
          네트워크 연결을 확인하고{'\n'}앱을 다시 시작해주세요.
        </Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <View className="flex-1 bg-cream-100">
            <NetworkBanner />
            <View className="flex-1">
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="post/[id]" />
                <Stack.Screen
                  name="post/edit/[id]"
                  options={{ presentation: 'modal', headerShown: false }}
                />
                <Stack.Screen name="admin" />
                <Stack.Screen name="groups/index" />
                <Stack.Screen name="groups/[groupId]" />
                <Stack.Screen
                  name="groups/create"
                  options={{ presentation: 'modal', headerShown: false }}
                />
                <Stack.Screen name="settings/index" />
              </Stack>
            </View>
          </View>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
