import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Button } from '../primitives/Button';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const emojiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 이모지 바운스
      Animated.loop(
        Animated.sequence([
          Animated.timing(emojiAnim, { toValue: -6, duration: 600, useNativeDriver: true }),
          Animated.timing(emojiAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    });
  }, [fadeAnim, scaleAnim, emojiAnim]);

  return (
    <View className="flex-1 items-center justify-center p-8">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}>
        <Animated.Text
          style={{ transform: [{ translateY: emojiAnim }] }}
          className="text-5xl text-center mb-4">
          😢
        </Animated.Text>
        <Text className="text-sm text-stone-600 dark:text-stone-300 text-center mb-6 font-medium leading-6">
          {message}
        </Text>
        {onRetry && (
          <View className="items-center">
            <Button title="다시 시도" onPress={onRetry} variant="secondary" size="sm" />
          </View>
        )}
      </Animated.View>
    </View>
  );
}
