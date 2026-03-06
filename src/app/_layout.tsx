import * as Sentry from '@sentry/react-native';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import Constants from 'expo-constants';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert, AppState, View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { queryClient } from '@/shared/lib/queryClient';
import { supabase } from '@/shared/lib/supabase';
import { AppErrorBoundary } from '@/shared/components/AppErrorBoundary';
import { NetworkBanner } from '@/shared/components/NetworkBanner';
import Toast from 'react-native-toast-message';
import '@/global.css';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const appEnv = Constants.expoConfig?.extra?.appEnv as string | undefined;
const appVersion = Constants.expoConfig?.version;

if (!__DEV__ && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: true,
    environment: appEnv ?? 'development',
    release: appVersion ? `gns-hermit-comm@${appVersion}` : undefined,
    beforeSend(event, _hint) {
      // 이메일·본문 등 PII 제거 (에러 메시지/extra에서)
      const message = event.message;
      if (message) {
        event.message = message.replace(
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
          '[email]',
        );
      }
      if (event.extra && typeof event.extra === 'object') {
        const safe: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(event.extra)) {
          if (
            k.toLowerCase().includes('email') ||
            k.toLowerCase().includes('password') ||
            k === 'author' ||
            k === 'display_name'
          ) {
            safe[k] = '[redacted]';
          } else {
            safe[k] = v;
          }
        }
        event.extra = safe;
      }
      return event;
    },
  });
}

async function checkAndApplyUpdate() {
  if (__DEV__) return;
  try {
    const Updates = await import('expo-updates');
    if (typeof Updates.checkForUpdateAsync !== 'function') return;
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      await Updates.fetchUpdateAsync();
      Alert.alert('업데이트 알림', '새 버전이 준비되었어요. 지금 적용할까요?', [
        { text: '나중에', style: 'cancel' },
        { text: '적용', onPress: () => Updates.reloadAsync() },
      ]);
    }
  } catch {
    // 네트워크 오류 시 무시
  }
}

export default function RootLayout() {
  const { loading, error } = useAuth();

  // 앱 실행 시 1회만 OTA 업데이트 확인 후 자동 적용 (사용자 선택 없음)
  useEffect(() => {
    checkAndApplyUpdate();
  }, []);

  // 포그라운드/백그라운드에 따라 Supabase 토큰 자동 갱신 제어
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
    };
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
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  animationDuration: 250,
                }}>
                <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
                <Stack.Screen
                  name="post/[id]"
                  options={{
                    animation: 'ios_from_right',
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                  }}
                />
                <Stack.Screen
                  name="post/edit/[id]"
                  options={{
                    presentation: 'modal',
                    headerShown: false,
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen name="admin" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen
                  name="groups/index"
                  options={{ animation: 'slide_from_right', gestureEnabled: true }}
                />
                <Stack.Screen
                  name="groups/[groupId]"
                  options={{
                    animation: 'ios_from_right',
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                  }}
                />
                <Stack.Screen
                  name="groups/create"
                  options={{
                    presentation: 'modal',
                    headerShown: false,
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="search"
                  options={{ animation: 'fade', animationDuration: 200 }}
                />
              </Stack>
            </View>
            <Toast />
          </View>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
