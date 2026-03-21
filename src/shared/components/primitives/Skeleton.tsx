import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface SkeletonProps {
  className?: string;
}

/** 기본 스켈레톤 블록 (shimmer 애니메이션) */
export function Skeleton({ className = '' }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity }}
      className={`rounded-lg bg-stone-200 dark:bg-stone-700 ${className}`.trim()}
    />
  );
}

/** PostCard 형태 스켈레톤 (제목/본문/메타) */
export function PostCardSkeleton() {
  return (
    <View className="rounded-3xl border border-cream-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 mb-4 shadow-sm">
      <Skeleton className="h-6 w-3/4 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-3" />
      <View className="flex-row justify-between items-center">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </View>
    </View>
  );
}

/** EmotionTags 스켈레톤 (태그 2~3개 형태) */
export function EmotionTagsSkeleton() {
  return (
    <View className="flex-row flex-wrap gap-2">
      <Skeleton className="h-7 w-14 rounded-full" />
      <Skeleton className="h-7 w-16 rounded-full" />
      <Skeleton className="h-7 w-12 rounded-full" />
    </View>
  );
}
