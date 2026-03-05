import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { pushPost } from '@/shared/lib/navigation';
import { useTrendingPosts } from '../hooks/useTrendingPosts';
import { EMOTION_EMOJI } from '@/shared/lib/constants';
import type { TrendingPost } from '@/types';

function TrendingPostCard({ post }: { post: TrendingPost }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => pushPost(router, post.id)}
      className="w-44 mr-3 p-3 rounded-xl bg-cream-50 dark:bg-stone-800 border border-cream-200 dark:border-stone-700 active:opacity-80"
      accessibilityLabel={`트렌딩 게시글: ${post.title}`}
      accessibilityRole="button">
      <Text
        className="text-sm font-semibold text-gray-800 dark:text-stone-100 mb-1"
        numberOfLines={2}>
        {post.title}
      </Text>

      <Text className="text-xs text-gray-500 dark:text-stone-400 mb-2" numberOfLines={1}>
        {post.display_name}
      </Text>

      {post.emotions && post.emotions.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mb-2">
          {post.emotions.slice(0, 2).map((emotion) => (
            <View key={emotion} className="rounded-full bg-stone-100 dark:bg-stone-700 px-2 py-0.5">
              <Text className="text-xs text-stone-500 dark:text-stone-400">
                {EMOTION_EMOJI[emotion] ?? '💬'} {emotion}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center gap-3">
        <Text className="text-xs text-gray-400 dark:text-stone-500">
          {'❤️ '}
          {post.like_count ?? 0}
        </Text>
        <Text className="text-xs text-gray-400 dark:text-stone-500">
          {'💬 '}
          {post.comment_count ?? 0}
        </Text>
      </View>
    </Pressable>
  );
}

export function TrendingPosts() {
  const { data: posts = [], isLoading } = useTrendingPosts();

  if (isLoading) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (posts.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="text-base font-bold text-gray-700 dark:text-stone-200 mb-3 px-1">
        지금 뜨는 글
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}>
        {posts.map((post) => (
          <TrendingPostCard key={post.id} post={post} />
        ))}
      </ScrollView>
    </View>
  );
}
