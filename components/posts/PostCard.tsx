import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Post } from '../../types';
import { formatDate } from '../../utils/format';

interface PostCardProps {
  post: Post;
}

export const PostCard = React.memo(({ post }: PostCardProps) => {
  return (
    <Link href={`/post/${post.id}`} asChild>
      <Pressable className="mx-4 mb-4 active:scale-[0.98]">
        <View className="bg-white rounded-3xl p-5 shadow-lg border-l-4 border-l-happy-400 border border-cream-200">
          <Text className="text-lg font-bold text-gray-800 mb-2" numberOfLines={2}>
            {post.title}
          </Text>
          
          <Text className="text-base text-gray-600 mb-4 leading-6" numberOfLines={3}>
            {post.content}
          </Text>
          
          <View className="flex-row justify-between items-center">
            <View className="bg-happy-100 px-3 py-1.5 rounded-full">
              <Text className="text-sm font-semibold text-happy-700">
                {post.author}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">
              {formatDate(post.created_at)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
});
