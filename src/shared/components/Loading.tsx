import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, Animated, useColorScheme } from 'react-native';

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
      <View
        style={{
          shadowColor: '#FFC300',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 4,
        }}
        className="bg-white dark:bg-stone-800 rounded-2xl p-5 mb-4">
        <ActivityIndicator size={size} color="#FFC300" />
      </View>
      {message && (
        <Text className="mt-3 text-sm text-stone-500 dark:text-stone-400 text-center font-medium">
          {message}
        </Text>
      )}
    </View>
  );
}

/** 시머 애니메이션이 적용된 스켈레톤 박스 */
function ShimmerBox({ className }: { className: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark ? [0.3, 0.6] : [0.5, 0.9],
  });

  return <Animated.View style={{ opacity }} className={className} />;
}

function SkeletonCard({ delay }: { delay: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, delay]);

  return (
    <Animated.View
      style={{ opacity: fadeAnim }}
      className={`rounded-2xl p-4 mb-3.5 mx-4 border ${
        isDark ? 'bg-stone-900 border-stone-700/60' : 'bg-white border-stone-200/80'
      }`}>
      <ShimmerBox
        className={`h-5 rounded-lg w-3/4 mb-3 ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`}
      />
      <ShimmerBox
        className={`h-3.5 rounded-md w-full mb-2 ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}
      />
      <ShimmerBox
        className={`h-3.5 rounded-md w-5/6 mb-3 ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}
      />
      <View className="flex-row justify-between items-center">
        <ShimmerBox
          className={`h-6 rounded-full w-20 ${isDark ? 'bg-happy-900/30' : 'bg-happy-100'}`}
        />
        <ShimmerBox className={`h-3 rounded w-14 ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />
      </View>
    </Animated.View>
  );
}

function SkeletonLoader() {
  return (
    <View className="pt-3">
      {[0, 1, 2].map((i) => (
        <SkeletonCard key={`skeleton-${i}`} delay={i * 120} />
      ))}
    </View>
  );
}
