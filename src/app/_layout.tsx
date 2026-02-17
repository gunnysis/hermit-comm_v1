import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { queryClient } from '@/shared/lib/queryClient';
import '@/global.css';

// #region agent log
const _log = (message: string, data: Record<string, unknown>) => {
  fetch('http://127.0.0.1:7253/ingest/90f7134e-6d97-4475-aa60-bbd05c5333c0', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location: 'app/_layout.tsx', message, data, timestamp: Date.now() }),
  }).catch(() => {});
};
_log('_layout module loaded (imports done)', {});
_log('splash config at runtime', {
  hypothesisId: 'A',
  splash: Constants.expoConfig?.splash ?? null,
  splashImage: Constants.expoConfig?.splash?.image ?? null,
});
// #endregion

async function checkAndApplyUpdate() {
  _log('checkAndApplyUpdate called', { __DEV__ });
  if (__DEV__) return;
  try {
    const Updates = await import('expo-updates');
    if (typeof Updates.checkForUpdateAsync !== 'function') return;
    _log('about to checkForUpdateAsync', {});
    const result = await Updates.checkForUpdateAsync();
    _log('checkForUpdateAsync done', { isAvailable: result?.isAvailable });
    if (result.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (err) {
    _log('checkAndApplyUpdate catch', { errMsg: err instanceof Error ? err.message : String(err) });
    // 네트워크 오류 등 시 무시 (사용자 안내 없음)
  }
}

export default function RootLayout() {
  _log('RootLayout render', {});
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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="post/[id]" />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
