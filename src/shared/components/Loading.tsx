import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  skeleton?: boolean;
}

export function Loading({ message, size = 'large', skeleton = false }: LoadingProps) {
  if (skeleton) {
    return <SkeletonLoader />;
  }

  return (
    <View className="flex-1 items-center justify-center p-8">
      <View className="bg-white dark:bg-stone-800 rounded-full p-6 shadow-lg mb-4">
        <ActivityIndicator size={size} color="#FFC300" />
      </View>
      {message && (
        <Text className="mt-4 text-base text-gray-600 dark:text-stone-400 text-center">
          {message}
        </Text>
      )}
    </View>
  );
}

function SkeletonLoader() {
  return (
    <View className="p-4">
      {[1, 2, 3].map((i) => (
        <View
          key={`skeleton-${i}`}
          className="bg-white dark:bg-stone-900 rounded-3xl p-4 mb-4 shadow-sm border border-cream-100 dark:border-stone-700">
          <View className="h-6 bg-cream-200 dark:bg-stone-700 rounded-xl w-3/4 mb-3" />
          <View className="h-4 bg-cream-100 dark:bg-stone-800 rounded-lg w-full mb-2" />
          <View className="h-4 bg-cream-100 dark:bg-stone-800 rounded-lg w-5/6 mb-3" />
          <View className="flex-row justify-between items-center">
            <View className="h-4 bg-happy-200 dark:bg-happy-900 rounded-full w-24" />
            <View className="h-3 bg-gray-200 dark:bg-stone-700 rounded w-16" />
          </View>
        </View>
      ))}
    </View>
  );
}
