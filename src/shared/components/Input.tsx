import React, { useRef, useCallback } from 'react';
import {
  TextInput,
  View,
  Text,
  TextInputProps,
  Animated,
  useColorScheme,
  NativeSyntheticEvent,
  TargetedEvent,
} from 'react-native';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  accessibilityHint?: string;
}

export function Input({ label, error, className, accessibilityHint, ...props }: InputProps) {
  const { placeholder } = useThemeColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback(
    (e: NativeSyntheticEvent<TargetedEvent>) => {
      Animated.spring(borderAnim, {
        toValue: 1,
        friction: 6,
        tension: 200,
        useNativeDriver: false,
      }).start();
      props.onFocus?.(e);
    },
    [borderAnim, props],
  );

  const handleBlur = useCallback(
    (e: NativeSyntheticEvent<TargetedEvent>) => {
      Animated.timing(borderAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      props.onBlur?.(e);
    },
    [borderAnim, props],
  );

  const borderColor = error
    ? isDark
      ? '#FF8F85'
      : '#FF7366'
    : borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: isDark ? ['#44403C', '#FFDB66'] : ['#E5E7EB', '#FFCF33'],
      });

  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark ? ['#1C1917', '#1C1917'] : ['#FAFAF9', '#FFFEF5'],
  });

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1.5 tracking-wide uppercase">
          {label}
        </Text>
      )}
      <Animated.View
        style={{
          borderColor,
          backgroundColor: bgColor,
          borderWidth: 1.5,
          borderRadius: 14,
        }}>
        <TextInput
          className={`px-4 py-3 text-base text-gray-800 dark:text-stone-100 ${className || ''}`}
          placeholderTextColor={placeholder}
          accessibilityLabel={label}
          accessibilityHint={accessibilityHint}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error && (
        <Text className="text-xs text-coral-500 dark:text-coral-400 mt-1.5 ml-1">{error}</Text>
      )}
    </View>
  );
}
