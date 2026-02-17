import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsiveLayout, CONTENT_MAX_WIDTH } from '@/shared/hooks/useResponsiveLayout';

interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  const { isWide } = useResponsiveLayout();

  return (
    <SafeAreaView className="flex-1 bg-cream-100">
      <View
        className="flex-1 bg-cream-50"
        style={
          isWide
            ? {
                maxWidth: CONTENT_MAX_WIDTH,
                alignSelf: 'center',
                width: '100%',
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderColor: '#FFF2AD',
              }
            : undefined
        }>
        {children}
      </View>
    </SafeAreaView>
  );
}
