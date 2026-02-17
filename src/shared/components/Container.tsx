import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return (
    <SafeAreaView className="flex-1 bg-cream-50">
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
