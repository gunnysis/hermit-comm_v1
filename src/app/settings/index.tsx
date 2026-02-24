import React, { useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { pushAdminLogin } from '@/shared/lib/navigation';
import Constants from 'expo-constants';
import { Container } from '@/shared/components/Container';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  detail?: string;
  destructive?: boolean;
}

function SettingsItem({ icon, label, onPress, detail, destructive }: SettingsItemProps) {
  const { icon: iconColor, iconDestructive, chevron } = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3.5 bg-white dark:bg-stone-900 active:bg-cream-50 dark:active:bg-stone-800"
      accessibilityLabel={label}
      accessibilityRole="button">
      <Ionicons name={icon} size={20} color={destructive ? iconDestructive : iconColor} />
      <Text
        className={`flex-1 ml-3 text-base ${destructive ? 'text-coral-500' : 'text-gray-800 dark:text-stone-100'}`}>
        {label}
      </Text>
      {detail && <Text className="text-sm text-gray-400 dark:text-stone-500 mr-1">{detail}</Text>}
      <Ionicons name="chevron-forward" size={16} color={chevron} />
    </Pressable>
  );
}

/** 정보 전용 행 — 클릭 불가, 버전 등 표시용 */
function SettingsInfoItem({
  icon,
  label,
  detail,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
}) {
  const { icon: iconColor } = useThemeColors();
  return (
    <View
      className="flex-row items-center px-4 py-3.5 bg-white dark:bg-stone-900"
      accessibilityLabel={detail ? `${label} ${detail}` : label}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text className="flex-1 ml-3 text-base text-gray-800 dark:text-stone-100">{label}</Text>
      {detail && <Text className="text-sm text-gray-400 dark:text-stone-500">{detail}</Text>}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleAdminAccess = useCallback(() => {
    pushAdminLogin(router);
  }, [router]);

  return (
    <Container>
      <StatusBar style="auto" />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <ScreenHeader title="설정" />

        <View className="mt-4 mx-4 rounded-2xl overflow-hidden border border-cream-200 dark:border-stone-700">
          <SettingsInfoItem
            icon="information-circle-outline"
            label="앱 버전"
            detail={`v${appVersion}`}
          />
        </View>

        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-cream-200 dark:border-stone-700">
          <SettingsItem
            icon="shield-outline"
            label="운영자 관리 페이지"
            onPress={handleAdminAccess}
          />
        </View>

        <View className="items-center mt-8 px-4">
          <Text className="text-xs text-gray-400 dark:text-stone-500 text-center">
            은둔마을 - 따뜻한 익명 커뮤니티
          </Text>
          <Text className="text-xs text-gray-300 dark:text-stone-600 mt-1">v{appVersion}</Text>
        </View>
      </ScrollView>
    </Container>
  );
}
