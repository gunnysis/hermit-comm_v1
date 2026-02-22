import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

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

  const variantClasses = {
    primary: 'bg-happy-500 dark:bg-happy-600 shadow-lg active:opacity-80',
    secondary:
      'bg-white dark:bg-stone-800 border-2 border-happy-300 dark:border-stone-600 active:bg-cream-50 dark:active:bg-stone-700 shadow-md',
    danger: 'bg-coral-500 dark:bg-coral-600 shadow-lg active:opacity-80',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 rounded-2xl',
    md: 'px-6 py-3 rounded-full',
    lg: 'px-8 py-4 rounded-full',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const textColorClasses = {
    primary: 'text-white',
    secondary: 'text-happy-700 dark:text-stone-200',
    danger: 'text-white',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50' : 'opacity-100'}
        items-center justify-center
      `}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#FFC300' : '#fff'} />
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
    </TouchableOpacity>
  );
}
