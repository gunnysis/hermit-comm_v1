import React, { useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Container } from '@/shared/components/Container';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  detail?: string;
  destructive?: boolean;
}

function SettingsItem({ icon, label, onPress, detail, destructive }: SettingsItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3.5 bg-white active:bg-cream-50"
      accessibilityLabel={label}
      accessibilityRole="button">
      <Ionicons name={icon} size={20} color={destructive ? '#FF7366' : '#6B7280'} />
      <Text className={`flex-1 ml-3 text-base ${destructive ? 'text-coral-500' : 'text-gray-800'}`}>
        {label}
      </Text>
      {detail && <Text className="text-sm text-gray-400 mr-1">{detail}</Text>}
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleAdminAccess = useCallback(() => {
    router.push('/admin/login' as Parameters<typeof router.push>[0]);
  }, [router]);

  return (
    <Container>
      <StatusBar style="dark" />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <ScreenHeader title="설정" />

        <View className="mt-4 mx-4 rounded-2xl overflow-hidden border border-cream-200">
          <SettingsItem
            icon="information-circle-outline"
            label="앱 버전"
            detail={`v${appVersion}`}
            onPress={() => {}}
          />
        </View>

        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-cream-200">
          <SettingsItem
            icon="shield-outline"
            label="운영자 관리 페이지"
            onPress={handleAdminAccess}
          />
        </View>

        <View className="items-center mt-8 px-4">
          <Text className="text-xs text-gray-400 text-center">은둔마을 - 따뜻한 익명 커뮤니티</Text>
          <Text className="text-xs text-gray-300 mt-1">v{appVersion}</Text>
        </View>
      </ScrollView>
    </Container>
  );
}
