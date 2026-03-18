import React, { memo, useCallback, useRef } from 'react';
import { View, Text, Pressable, Animated, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { MOTION } from '@/shared/lib/constants';
import {
  EMOTION_COLOR_MAP,
  EMOTION_EMOJI,
  ACTIVITY_PRESETS,
  SHARED_PALETTE,
} from '@/shared/lib/constants';
import { getActivityLabel } from '@/shared/lib/utils.generated';
import type { PostWithCounts } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DailyPostCardProps {
  post: PostWithCounts;
}

function DailyPostCardInner({ post }: DailyPostCardProps) {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const emotions = post.emotions ?? post.initial_emotions ?? [];
  const activities = post.activities ?? [];
  const content = post.content || '';

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.975,
      ...MOTION.spring.card,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...MOTION.spring.cardAlt,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={() => router.push(`/post/${post.id}`)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="mx-4 mb-3 rounded-2xl px-4 py-3"
        style={{
          backgroundColor: isDark ? 'rgba(41,37,36,0.5)' : SHARED_PALETTE.cream[50],
          borderWidth: 1,
          borderColor: isDark ? 'rgba(68,64,60,0.4)' : SHARED_PALETTE.cream[200],
        }}
        accessibilityLabel={`오늘의 하루 - ${emotions[0] ?? ''}`}>
        {/* 헤더 */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            오늘의 하루
          </Text>
          <Text className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
              locale: ko,
            })}
          </Text>
        </View>

        {/* 감정 칩 */}
        <View className="flex-row flex-wrap gap-1.5 mb-2">
          {emotions.map((emotion) => {
            const colors = EMOTION_COLOR_MAP[emotion];
            return (
              <View
                key={emotion}
                className="rounded-full px-3 py-1.5"
                style={{ backgroundColor: colors?.gradient[0] ?? '#E7D7FF' }}>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: isDark ? '#fff' : '#1c1917' }}>
                  {EMOTION_EMOJI[emotion]} {emotion}
                </Text>
              </View>
            );
          })}
        </View>

        {/* 활동 태그 */}
        {activities.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mb-2">
            {activities.map((act) => (
              <View
                key={act}
                className={`rounded-full px-2.5 py-1 border ${
                  isDark ? 'border-stone-600' : 'border-stone-300'
                }`}>
                <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {getActivityLabel(act, ACTIVITY_PRESETS)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 한마디 */}
        {content.length > 0 && (
          <Text
            className={`text-sm mb-2 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}
            numberOfLines={2}>
            &ldquo;{content}&rdquo;
          </Text>
        )}

        {/* 리액션 바 */}
        {(post.like_count > 0 || post.comment_count > 0) && (
          <View
            className="flex-row items-center gap-3 mt-1"
            accessibilityLabel={`좋아요 ${post.like_count}개, 댓글 ${post.comment_count}개`}>
            {post.like_count > 0 && (
              <Text className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                ❤️ {post.like_count}
              </Text>
            )}
            {post.comment_count > 0 && (
              <Text className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                💬 {post.comment_count}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export const DailyPostCard = memo(
  DailyPostCardInner,
  (prev, next) =>
    prev.post.id === next.post.id &&
    prev.post.like_count === next.post.like_count &&
    prev.post.comment_count === next.post.comment_count,
);
