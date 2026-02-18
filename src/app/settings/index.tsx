import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Container } from '@/shared/components/Container';

export default function SettingsScreen() {
  const router = useRouter();

  const handleAdminAccess = useCallback(() => {
    router.push('/admin/login' as Parameters<typeof router.push>[0]);
  }, [router]);

  return (
    <Container>
      <StatusBar style="dark" />
      <View className="flex-1 bg-cream-50">
        {/* 상단 헤더 */}
        <View className="px-4 pt-12 pb-4 border-b border-cream-200 bg-cream-50">
          <Text className="text-2xl font-bold text-gray-800">설정</Text>
        </View>

        {/* 본문: 관리자 진입 링크만 배치 */}
        <View className="flex-1 px-4 py-4 justify-end items-end">
          <Pressable
            onPress={handleAdminAccess}
            hitSlop={8}
            accessibilityLabel="관리자 페이지 접속"
            accessibilityHint="관리자 로그인 화면으로 이동합니다">
            <Text className="text-xs text-gray-400">운영자용 관리자 페이지로 이동</Text>
          </Pressable>
        </View>
      </View>
    </Container>
  );
}
