import React from 'react';
import { ScrollView, Text, Pressable, useColorScheme, View } from 'react-native';
import { ALLOWED_EMOTIONS, EMOTION_EMOJI, EMOTION_COLOR_MAP } from '@/shared/lib/constants';

interface EmotionFilterBarProps {
  selected: string | null;
  onSelect: (emotion: string | null) => void;
}

export function EmotionFilterBar({ selected, onSelect }: EmotionFilterBarProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-3"
      contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
      <Pressable
        onPress={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full ${
          selected === null
            ? isDark
              ? 'bg-stone-100'
              : 'bg-stone-800'
            : isDark
              ? 'bg-stone-800'
              : 'bg-stone-100'
        }`}>
        <Text
          className={`text-xs font-medium ${
            selected === null
              ? isDark
                ? 'text-stone-800'
                : 'text-white'
              : isDark
                ? 'text-stone-400'
                : 'text-stone-600'
          }`}>
          전체
        </Text>
      </Pressable>
      {ALLOWED_EMOTIONS.map((emotion) => {
        const isActive = selected === emotion;
        const colors = EMOTION_COLOR_MAP[emotion];
        return (
          <Pressable
            key={emotion}
            onPress={() => onSelect(isActive ? null : emotion)}
            style={isActive && colors ? { backgroundColor: colors.gradient[0] } : undefined}
            className={`px-3 py-1.5 rounded-full ${
              !isActive ? (isDark ? 'bg-stone-800' : 'bg-stone-100') : ''
            }`}>
            <Text className={`text-xs font-medium ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
              {EMOTION_EMOJI[emotion]} {emotion}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
