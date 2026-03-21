import React, { useCallback, useRef } from 'react';
import { Pressable, Text, ActivityIndicator, Animated, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MOTION } from '@/shared/lib/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      ...MOTION.spring.button,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...MOTION.spring.release,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [isDisabled, onPress]);

  const variantStyles = {
    primary: {
      className: 'bg-happy-500 dark:bg-happy-600',
      shadow: {
        shadowColor: '#FFC300',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.4 : 0.25,
        shadowRadius: 8,
        elevation: 4,
      },
    },
    secondary: {
      className: `border-[1.5px] ${
        isDark ? 'bg-stone-800/80 border-stone-600/60' : 'bg-white border-stone-200'
      }`,
      shadow: {
        shadowColor: isDark ? '#000' : '#9CA3AF',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.2 : 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    },
    danger: {
      className: 'bg-coral-500 dark:bg-coral-600',
      shadow: {
        shadowColor: '#FF7366',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.4 : 0.25,
        shadowRadius: 8,
        elevation: 4,
      },
    },
  };

  const sizeClasses = {
    sm: 'px-4 py-2.5 rounded-xl',
    md: 'px-6 py-3 rounded-2xl',
    lg: 'px-8 py-4 rounded-2xl',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const textColorClasses = {
    primary: 'text-white',
    secondary: isDark ? 'text-stone-200' : 'text-stone-700',
    danger: 'text-white',
  };

  const { className: variantClass, shadow } = variantStyles[variant];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
        style={isDisabled ? undefined : shadow}
        className={`
          ${variantClass}
          ${sizeClasses[size]}
          ${isDisabled ? 'opacity-40' : ''}
          items-center justify-center
        `}>
        {loading ? (
          <ActivityIndicator color={variant === 'secondary' ? '#FFC300' : '#fff'} size="small" />
        ) : (
          <Text
            className={`
              ${textSizeClasses[size]}
              ${textColorClasses[variant]}
              font-bold
            `}>
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
