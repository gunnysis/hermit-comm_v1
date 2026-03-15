import React from 'react';
import { View, Text, FlatList, Pressable, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Container } from '@/shared/components/Container';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useNotifications, useMarkAllRead } from '@/features/notifications/hooks/useNotifications';
import type { Notification } from '@/shared/lib/api/notifications';

export default function NotificationsScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { data: notifications = [] } = useNotifications();
  const { mutate: markAllRead } = useMarkAllRead();

  const getLabel = (n: Notification) => {
    const actor = n.actor_alias ?? '누군가';
    if (n.type === 'reaction') return `${actor}가 공감했어요`;
    if (n.type === 'comment') return `${actor}가 댓글을 남겼어요`;
    if (n.type === 'reply') return `${actor}가 답글을 달았어요`;
    return '';
  };

  return (
    <Container>
      <ScreenHeader
        title="알림"
        showBack
        rightContent={
          <Pressable onPress={() => markAllRead()} className="px-2 py-1.5">
            <Text className="text-xs font-semibold text-happy-700 dark:text-happy-400">
              모두 읽음
            </Text>
          </Pressable>
        }
      />
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => item.post_id && router.push(`/post/${item.post_id}`)}
            className={`px-4 py-3 border-b ${
              item.read
                ? isDark
                  ? 'border-stone-800'
                  : 'border-stone-100'
                : isDark
                  ? 'border-stone-700 bg-stone-800/30'
                  : 'border-stone-200 bg-cream-50'
            }`}>
            <Text className={`text-sm ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
              {getLabel(item)}
            </Text>
            <Text className={`text-xs mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ko })}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className={isDark ? 'text-stone-500' : 'text-stone-400'}>아직 알림이 없어요</Text>
          </View>
        }
      />
    </Container>
  );
}
