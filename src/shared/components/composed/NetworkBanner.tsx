import React from 'react';
import { View, Text } from 'react-native';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

export function NetworkBanner() {
  const { isConnected } = useNetworkStatus();

  if (isConnected !== false) {
    return null;
  }

  return (
    <View
      className="bg-coral-500 px-4 py-2"
      accessibilityRole="alert"
      accessibilityLabel="연결이 불안정해요. 잠시 후 다시 시도해주세요.">
      <Text className="text-center text-sm font-medium text-white">
        연결이 불안정해요. 잠시 후 다시 시도해주세요.
      </Text>
    </View>
  );
}
