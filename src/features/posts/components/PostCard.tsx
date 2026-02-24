import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { pushPost } from '@/shared/lib/navigation';
import { Post } from '@/types';
import { formatDate } from '@/shared/utils/format';
import { getExcerpt } from '@/shared/utils/html';

interface PostCardProps {
  post: Post;
}

function buildAccessibilityLabel(post: Post): string {
  const author = post.display_name ?? post.author;
  const commentCount = post.comment_count ?? 0;
  const emotions = post.emotions?.length ? `, 감정: ${post.emotions.slice(0, 2).join(', ')}` : '';
  const label = `제목: ${post.title}, 작성자 ${author}, 댓글 ${commentCount}개${emotions}`;
  return label.length > 80 ? label.slice(0, 77) + '…' : label;
}

const PostCardComponent = ({ post }: PostCardProps) => {
  const router = useRouter();
  const excerpt = useMemo(() => getExcerpt(post.content, 120), [post.content]);
  const handlePress = useCallback(() => {
    pushPost(router, post.id);
  }, [router, post.id]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.98}
      className="mx-4 mb-4"
      accessibilityRole="button"
      accessibilityLabel={buildAccessibilityLabel(post)}>
      <View className="bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-lg border border-cream-200 dark:border-stone-700 border-l-4 border-l-happy-400">
        {post.image_url ? (
          <Image
            source={{ uri: post.image_url }}
            className="w-full h-32 bg-stone-100 dark:bg-stone-800"
            resizeMode="cover"
            accessibilityLabel="게시글 썸네일"
          />
        ) : null}
        <View className="p-5">
          <Text
            className="text-lg font-bold text-gray-800 dark:text-stone-100 mb-2"
            numberOfLines={2}>
            {post.title}
          </Text>

          <Text
            className="text-base text-gray-600 dark:text-stone-400 mb-3 leading-6"
            numberOfLines={3}>
            {excerpt}
          </Text>

          {post.emotions && post.emotions.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5 mb-3">
              {post.emotions.slice(0, 2).map((emotion) => (
                <View
                  key={emotion}
                  className="rounded-full bg-stone-100 dark:bg-stone-800 px-2.5 py-1">
                  <Text className="text-xs text-stone-600 dark:text-stone-300">{emotion}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View className="flex-row justify-between items-center flex-wrap gap-2">
            <View className="flex-row items-center gap-2">
              <View className="bg-happy-100 dark:bg-happy-900/40 px-3 py-1.5 rounded-full">
                <Text className="text-sm font-semibold text-happy-700 dark:text-happy-300">
                  {post.display_name ?? post.author}
                </Text>
              </View>
              {post.comment_count !== undefined && (
                <View className="bg-mint-100 dark:bg-mint-900/40 px-2.5 py-1 rounded-full">
                  <Text className="text-xs font-medium text-mint-700 dark:text-mint-300">
                    댓글 {post.comment_count}개
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-xs text-gray-400 dark:text-stone-500">
              {formatDate(post.created_at)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
PostCardComponent.displayName = 'PostCard';
export const PostCard = React.memo(PostCardComponent);
