import React, { useState } from 'react';
import { View, Text, Pressable, useColorScheme, ActivityIndicator } from 'react-native';
import { useBlockedAliases, useUnblockUser } from '@/features/blocks/hooks/useBlocks';
import { Skeleton } from '@/shared/components/primitives/Skeleton';

export function BlockedUsersSection({ enabled = true }: { enabled?: boolean }) {
  const isDark = useColorScheme() === 'dark';
  const { data: blockedAliases = [], isLoading } = useBlockedAliases(enabled);
  const { mutate: unblock } = useUnblockUser();
  const [unblockingAlias, setUnblockingAlias] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View>
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-sm">🚫</Text>
          <Text className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
            차단 관리
          </Text>
        </View>
        <Skeleton className="w-full h-10 rounded-lg" />
      </View>
    );
  }

  const handleUnblock = (alias: string) => {
    setUnblockingAlias(alias);
    unblock(alias, {
      onSettled: () => setUnblockingAlias(null),
    });
  };

  return (
    <View>
      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-sm">🚫</Text>
        <Text className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
          차단 관리
        </Text>
        {blockedAliases.length > 0 && (
          <Text className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            {blockedAliases.length}명
          </Text>
        )}
      </View>
      {blockedAliases.length === 0 ? (
        <Text className={`text-xs pl-6 py-2 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
          차단한 사용자가 없어요
        </Text>
      ) : (
        <View className="pl-6 gap-1">
          {blockedAliases.map((alias) => (
            <View
              key={alias}
              className={`flex-row items-center justify-between rounded-lg px-3 py-2 ${
                isDark ? 'bg-stone-800' : 'bg-stone-100'
              }`}>
              <Text className={`text-sm ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                {alias}
              </Text>
              <Pressable
                disabled={unblockingAlias === alias}
                onPress={() => handleUnblock(alias)}
                style={{ opacity: unblockingAlias === alias ? 0.5 : 1 }}>
                {unblockingAlias === alias ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    해제
                  </Text>
                )}
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
