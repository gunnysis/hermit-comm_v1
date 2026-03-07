import React from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { PostCard } from '@/features/posts/components/PostCard';
import type { Post } from '@/types';

export function EmotionPostList({ posts }: { posts: Post[] }) {
  return (
    <View style={{ flex: 1 }} className="min-h-0">
      <FlashList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
      />
    </View>
  );
}
