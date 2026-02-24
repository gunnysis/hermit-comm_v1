import React from 'react';
import { View, Text } from 'react-native';
import { PostBody } from './PostBody';
import { EmotionTags } from './EmotionTags';
import { ReactionBar } from './ReactionBar';
import { formatDate } from '@/shared/utils/format';
import type { Post, Reaction } from '@/types';

interface PostDetailBodyProps {
  post: Post;
  postAnalysis: { emotions: string[] } | undefined | null;
  analysisLoading: boolean;
  reactions: Reaction[];
  userReactedTypes: string[];
  onReaction: (reactionType: string) => void;
  pendingTypes: Set<string>;
}

export function PostDetailBody({
  post,
  postAnalysis,
  analysisLoading,
  reactions,
  userReactedTypes,
  onReaction,
  pendingTypes,
}: PostDetailBodyProps) {
  return (
    <View className="mx-4 mt-4 rounded-2xl border border-cream-200 bg-white shadow-md overflow-hidden">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-800 mb-3">{post.title}</Text>
        <View className="flex-row justify-between items-center mb-4">
          <View className="bg-happy-100 px-3 py-1.5 rounded-full">
            <Text className="text-sm font-semibold text-happy-700">
              {post.display_name ?? post.author}
            </Text>
          </View>
          <Text className="text-xs text-gray-400">{formatDate(post.created_at)}</Text>
        </View>
        <View className="mb-6" accessibilityLabel="게시글 본문">
          <PostBody content={post.content} imageUrl={post.image_url} />
        </View>
        <EmotionTags
          emotions={postAnalysis?.emotions ?? []}
          isLoading={analysisLoading && postAnalysis == null}
        />
        <View className="border-t border-cream-200 pt-4 items-start">
          <ReactionBar
            reactions={reactions}
            userReactedTypes={userReactedTypes}
            onReaction={onReaction}
            pendingTypes={pendingTypes}
          />
        </View>
      </View>
    </View>
  );
}
