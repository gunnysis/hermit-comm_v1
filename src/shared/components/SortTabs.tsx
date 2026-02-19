import React from 'react';
import { View, Text, Pressable } from 'react-native';

export type SortOrder = 'latest' | 'popular';

interface SortTabsProps {
  value: SortOrder;
  onChange: (order: SortOrder) => void;
}

export function SortTabs({ value, onChange }: SortTabsProps) {
  return (
    <View className="flex-row mt-3 gap-2">
      <Pressable
        onPress={() => onChange('latest')}
        className={`flex-1 py-2 rounded-xl ${
          value === 'latest' ? 'bg-happy-400' : 'bg-white border border-cream-200'
        }`}
        accessibilityLabel="최신순 정렬"
        accessibilityRole="button">
        <Text
          className={`text-center font-semibold ${
            value === 'latest' ? 'text-white' : 'text-gray-600'
          }`}>
          최신순
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('popular')}
        className={`flex-1 py-2 rounded-xl ${
          value === 'popular' ? 'bg-happy-400' : 'bg-white border border-cream-200'
        }`}
        accessibilityLabel="인기순 정렬"
        accessibilityRole="button">
        <Text
          className={`text-center font-semibold ${
            value === 'popular' ? 'text-white' : 'text-gray-600'
          }`}>
          인기순
        </Text>
      </Pressable>
    </View>
  );
}
