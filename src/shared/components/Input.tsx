import React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  accessibilityHint?: string;
}

export function Input({ label, error, className, accessibilityHint, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-semibold text-gray-700 dark:text-stone-300 mb-2">
          {label}
        </Text>
      )}
      <TextInput
        className={`
          bg-cream-50 dark:bg-stone-800 border-2 rounded-2xl px-4 py-3 text-base text-gray-800 dark:text-stone-100
          ${error ? 'border-coral-500 dark:border-coral-500' : 'border-cream-200 dark:border-stone-600'}
          ${className || ''}
        `}
        placeholderTextColor="#9CA3AF"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        {...props}
      />
      {error && <Text className="text-xs text-coral-500 dark:text-coral-400 mt-2">{error}</Text>}
    </View>
  );
}
