import React from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { ALLOWED_EMOTIONS, EMOTION_EMOJI, EMOTION_COLOR_MAP } from '@/shared/lib/constants';

interface EmotionFilterBarProps {
  selected: string | null;
  onSelect: (emotion: string | null) => void;
}

export function EmotionFilterBar({ selected, onSelect }: EmotionFilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-3"
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      <Pressable
        onPress={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full ${
          selected === null
            ? 'bg-stone-800 dark:bg-stone-200'
            : 'bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700'
        }`}>
        <Text
          className={`text-xs font-semibold ${
            selected === null
              ? 'text-white dark:text-stone-800'
              : 'text-stone-600 dark:text-stone-300'
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
              isActive
                ? 'border border-stone-300 dark:border-stone-500'
                : 'bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700'
            }`}>
            <Text
              className={`text-xs ${
                isActive
                  ? 'font-semibold text-stone-800 dark:text-stone-100'
                  : 'text-stone-600 dark:text-stone-300'
              }`}>
              {EMOTION_EMOJI[emotion]} {emotion}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
