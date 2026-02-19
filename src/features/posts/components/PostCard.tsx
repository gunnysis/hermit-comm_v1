import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Post } from '@/types';
import { formatDate } from '@/shared/utils/format';

interface PostCardProps {
  post: Post;
}

function buildAccessibilityLabel(post: Post): string {
  const author = post.display_name ?? post.author;
  const commentCount = post.comment_count ?? 0;
  const label = `제목: ${post.title}, 작성자 ${author}, 댓글 ${commentCount}개`;
  return label.length > 80 ? label.slice(0, 77) + '…' : label;
}

const PostCardComponent = ({ post }: PostCardProps) => (
  <Link href={`/post/${post.id}`} asChild>
    <Pressable
      className="mx-4 mb-4 active:scale-[0.98]"
      accessibilityRole="button"
      accessibilityLabel={buildAccessibilityLabel(post)}>
      <View className="bg-white rounded-3xl p-5 shadow-lg border-l-4 border-l-happy-400 border border-cream-200">
        <Text className="text-lg font-bold text-gray-800 mb-2" numberOfLines={2}>
          {post.title}
        </Text>

        <Text className="text-base text-gray-600 mb-4 leading-6" numberOfLines={3}>
          {post.content}
        </Text>

        <View className="flex-row justify-between items-center flex-wrap gap-2">
          <View className="flex-row items-center gap-2">
            <View className="bg-happy-100 px-3 py-1.5 rounded-full">
              <Text className="text-sm font-semibold text-happy-700">
                {post.display_name ?? post.author}
              </Text>
            </View>
            {post.comment_count !== undefined && (
              <View className="bg-mint-100 px-2.5 py-1 rounded-full">
                <Text className="text-xs font-medium text-mint-700">
                  댓글 {post.comment_count}개
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-gray-400">{formatDate(post.created_at)}</Text>
        </View>
      </View>
    </Pressable>
  </Link>
);
PostCardComponent.displayName = 'PostCard';
export const PostCard = React.memo(PostCardComponent);
