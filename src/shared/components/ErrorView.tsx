import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-6xl mb-4">😢</Text>
      <Text className="text-base text-gray-700 dark:text-stone-300 text-center mb-6 font-medium">
        {message}
      </Text>
      {onRetry && (
        <View className="min-w-[120px]">
          <Button title="다시 시도" onPress={onRetry} variant="secondary" />
        </View>
      )}
    </View>
  );
}
