import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

export function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: count = 0 } = useUnreadCount(!!user);
  const { text } = useThemeColors();

  const handlePress = () => {
    router.push({ pathname: '/notifications' } as never);
  };

  return (
    <Pressable onPress={handlePress} className="relative p-2.5" hitSlop={6} accessibilityLabel={`알림${count > 0 ? ` ${count}개 읽지 않음` : ''}`} accessibilityRole="button">
      <Ionicons name="notifications-outline" size={22} color={text} />
      {count > 0 && (
        <View className="absolute top-1 right-1 bg-coral-500 rounded-full w-4 h-4 items-center justify-center">
          <Text className="text-white text-[9px] font-bold">{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </Pressable>
  );
}
