import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Container } from '@/shared/components/Container';
import { auth } from '@/features/auth/auth';
import { toFriendlyErrorMessage } from '@/shared/lib/errors';
import Constants from 'expo-constants';

export default function AdminIndexScreen() {
  const router = useRouter();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      await auth.signInAnonymously();
      router.replace('/(tabs)');
    } catch (e) {
      const message = toFriendlyErrorMessage(e, '로그아웃에 실패했습니다. 다시 시도해주세요.');
      Alert.alert('로그아웃 실패', message);
    }
  }, [router]);

  return (
    <Container>
      <StatusBar style="auto" />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* 헤더 */}
        <View className="bg-happy-100 dark:bg-stone-900 px-4 pt-12 pb-6 border-b border-cream-200 dark:border-stone-700 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={handleBack} className="py-2 pr-2" accessibilityLabel="뒤로 가기">
              <Text className="text-base text-gray-600 dark:text-stone-400">← 뒤로</Text>
            </Pressable>
            <Pressable onPress={handleLogout} className="py-2 pl-2" accessibilityLabel="로그아웃">
              <Text className="text-base text-gray-600 dark:text-stone-400">로그아웃</Text>
            </Pressable>
          </View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-stone-100 mt-2">관리자</Text>
          <Text className="text-sm text-gray-600 dark:text-stone-400 mt-1">
            은둔마을 관리자 대시보드
          </Text>
        </View>

        {/* 관리자 정보 */}
        <View className="p-4">
          <View className="bg-white dark:bg-stone-900 rounded-2xl px-4 py-5 border border-cream-200 dark:border-stone-700">
            <Text className="text-base font-semibold text-gray-800 dark:text-stone-100 mb-2">
              관리자 기능
            </Text>
            <Text className="text-sm text-gray-500 dark:text-stone-400">
              현재 관리자 기능이 준비 중입니다.
            </Text>
          </View>
        </View>

        {/* 앱 버전 정보 */}
        <View className="items-center mt-8 px-4 pb-4">
          <Text className="text-xs text-gray-400 dark:text-stone-500">v{appVersion}</Text>
        </View>
      </ScrollView>
    </Container>
  );
}
