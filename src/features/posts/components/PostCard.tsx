import React, { useMemo, useCallback, useRef } from 'react';
import { View, Text, Pressable, Image, Animated, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { pushPost } from '@/shared/lib/navigation';
import { Post } from '@/types';
import { formatDate, formatReactionCount } from '@/shared/utils/format';
import { getExcerpt } from '@/shared/utils/html';
import { EMOTION_EMOJI, EMOTION_COLOR_MAP, MOTION } from '@/shared/lib/constants';

interface PostCardProps {
  post: Post;
}

function buildAccessibilityLabel(post: Post): string {
  const author = post.display_name;
  const commentCount = post.comment_count ?? 0;
  const likeCount = post.like_count ?? 0;
  const reactions = likeCount > 0 ? `, 좋아요 ${likeCount}개` : '';
  const emotions = post.emotions?.length ? `, 감정: ${post.emotions.slice(0, 2).join(', ')}` : '';
  const label = `제목: ${post.title}, 작성자 ${author}, 댓글 ${commentCount}개${reactions}${emotions}`;
  return label.length > 80 ? label.slice(0, 77) + '…' : label;
}

const PostCardComponent = ({ post }: PostCardProps) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const excerpt = useMemo(() => getExcerpt(post.content, 120), [post.content]);
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const handlePress = useCallback(() => {
    pushPost(router, post.id);
  }, [router, post.id]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="mx-4 mb-2.5">
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={buildAccessibilityLabel(post)}>
        <View
          style={{
            shadowColor: isDark ? '#000' : '#78716C',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 12,
            elevation: 4,
          }}
          className={`rounded-xl overflow-hidden border ${
            isDark ? 'bg-stone-900 border-stone-700/60' : 'bg-white border-stone-200/80'
          }`}>
          {post.emotions?.[0] && EMOTION_COLOR_MAP[post.emotions[0]] && (
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                backgroundColor: EMOTION_COLOR_MAP[post.emotions[0]].gradient[1],
                borderTopLeftRadius: 12,
                borderBottomLeftRadius: 12,
                zIndex: 1,
              }}
            />
          )}
          {post.image_url ? (
            <Image
              source={{ uri: post.image_url }}
              className="w-full h-36 bg-stone-100 dark:bg-stone-800"
              resizeMode="cover"
              accessibilityLabel="게시글 썸네일"
            />
          ) : null}
          <View className="p-4">
            <Text
              className="text-[17px] font-bold text-gray-800 dark:text-stone-100 leading-6 mb-2"
              numberOfLines={2}>
              {post.title}
            </Text>

            <Text
              className="text-[14px] text-gray-500 dark:text-stone-400 mb-2 leading-5"
              numberOfLines={3}>
              {excerpt}
            </Text>

            {post.emotions && post.emotions.length > 0 ? (
              <View className="flex-row flex-wrap gap-1.5 mb-2">
                {post.emotions.slice(0, 2).map((emotion) => {
                  const emoji = EMOTION_EMOJI[emotion] ?? '💬';
                  const emotionColors = EMOTION_COLOR_MAP[emotion];
                  return (
                    <View
                      key={emotion}
                      style={
                        emotionColors
                          ? {
                              backgroundColor: isDark
                                ? emotionColors.gradient[1] + '25'
                                : emotionColors.gradient[0],
                              borderColor: emotionColors.gradient[1],
                              borderWidth: 1,
                            }
                          : undefined
                      }
                      className={`rounded-full px-2.5 py-0.5 ${
                        !emotionColors ? (isDark ? 'bg-stone-800/80' : 'bg-stone-50') : ''
                      }`}>
                      <Text
                        style={emotionColors && !isDark ? { color: '#57534E' } : undefined}
                        className={`text-xs font-medium ${
                          !emotionColors
                            ? 'text-stone-500 dark:text-stone-400'
                            : 'dark:text-stone-300'
                        }`}>
                        {emoji} {emotion}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <View className="flex-row justify-between items-center flex-wrap gap-2">
              <View className="flex-row items-center gap-1.5">
                <View
                  className={`px-2.5 py-1 rounded-full ${
                    isDark ? 'bg-happy-900/40' : 'bg-happy-50'
                  }`}>
                  <Text className="text-xs font-semibold text-happy-700 dark:text-happy-300">
                    {post.display_name}
                  </Text>
                </View>
                {(post.like_count ?? 0) > 0 && (
                  <View
                    className={`flex-row items-center px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-coral-900/30' : 'bg-coral-50'
                    }`}>
                    <Text className="text-[11px] font-medium text-coral-600 dark:text-coral-300">
                      ❤️ {formatReactionCount(post.like_count ?? 0)}
                    </Text>
                  </View>
                )}
                {(post.comment_count ?? 0) > 0 && (
                  <View
                    className={`flex-row items-center px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-stone-800/60' : 'bg-stone-50'
                    }`}>
                    <Text className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                      💬 {post.comment_count}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-[11px] text-stone-400 dark:text-stone-500">
                {formatDate(post.created_at)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};
PostCardComponent.displayName = 'PostCard';
export const PostCard = React.memo(PostCardComponent);
