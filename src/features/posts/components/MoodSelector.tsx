import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { ALLOWED_EMOTIONS, EMOTION_EMOJI, EMOTION_COLOR_MAP } from '@/shared/lib/constants';

interface MoodSelectorProps {
  value: string[];
  onChange: (emotions: string[]) => void;
  maxSelect?: number;
}

export function MoodSelector({ value, onChange, maxSelect = 3 }: MoodSelectorProps) {
  const isDark = useColorScheme() === 'dark';

  const toggle = (emotion: string) => {
    if (value.includes(emotion)) {
      onChange(value.filter((e) => e !== emotion));
    } else if (value.length < maxSelect) {
      onChange([...value, emotion]);
    }
  };

  return (
    <View className="py-4">
      <Text className="text-base font-semibold text-center text-gray-800 dark:text-stone-100">
        지금 어떤 마음인가요?
      </Text>
      <Text className="text-sm text-center text-gray-500 dark:text-stone-400 mt-1 mb-4">
        최대 {maxSelect}개까지 선택할 수 있어요
      </Text>
      <View className="flex-row flex-wrap justify-center gap-2 px-4">
        {ALLOWED_EMOTIONS.map((emotion) => {
          const isSelected = value.includes(emotion);
          const colors = EMOTION_COLOR_MAP[emotion];
          return (
            <Pressable
              key={emotion}
              onPress={() => toggle(emotion)}
              style={
                isSelected && colors
                  ? {
                      backgroundColor: colors.gradient[0],
                      borderWidth: 2,
                      borderColor: colors.gradient[1],
                    }
                  : undefined
              }
              className={`px-3 py-2 rounded-xl ${
                !isSelected ? (isDark ? 'bg-stone-800' : 'bg-stone-100') : ''
              }`}>
              <Text
                className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                {EMOTION_EMOJI[emotion]} {emotion}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
