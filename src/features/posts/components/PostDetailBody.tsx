import React from 'react';
import { View, Text } from 'react-native';
import { PostBody } from './PostBody';
import { EmotionTags } from './EmotionTags';
import { ReactionBar } from './ReactionBar';
import { RecommendedPosts } from './RecommendedPosts';
import { formatDate } from '@/shared/utils/format';
import type { Post, Reaction, RecommendedPost } from '@/types';

interface PostDetailBodyProps {
  post: Post;
  postAnalysis: { emotions: string[] } | undefined | null;
  analysisLoading: boolean;
  reactions: Reaction[];
  userReactedTypes: string[];
  onReaction: (reactionType: string) => void;
  pendingTypes: Set<string>;
  recommendedPosts?: RecommendedPost[];
  recommendedPostsLoading?: boolean;
  /** 감정 태그 클릭 시 콜백 */
  onEmotionPress?: (emotion: string) => void;
  /** 분석 재시도 콜백 */
  onRetryAnalysis?: () => void;
}

export function PostDetailBody({
  post,
  postAnalysis,
  analysisLoading,
  reactions,
  userReactedTypes,
  onReaction,
  pendingTypes,
  recommendedPosts = [],
  recommendedPostsLoading = false,
  onEmotionPress,
  onRetryAnalysis,
}: PostDetailBodyProps) {
  const isAnalysisDone = !analysisLoading && postAnalysis !== undefined;

  return (
    <View className="mx-4 mt-4 rounded-2xl border border-cream-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-md overflow-hidden">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-800 dark:text-stone-100 mb-3">
          {post.title}
        </Text>
        <View className="flex-row justify-between items-center mb-4">
          <View className="bg-happy-100 dark:bg-happy-900/40 px-3 py-1.5 rounded-full">
            <Text className="text-sm font-semibold text-happy-700 dark:text-happy-300">
              {post.display_name ?? post.author}
            </Text>
          </View>
          <Text className="text-xs text-gray-400 dark:text-stone-500">
            {formatDate(post.created_at)}
          </Text>
        </View>
        <View className="mb-6" accessibilityLabel="게시글 본문">
          <PostBody content={post.content} imageUrl={post.image_url} />
        </View>
        <EmotionTags
          emotions={postAnalysis?.emotions ?? []}
          isLoading={analysisLoading && postAnalysis == null}
          onPress={onEmotionPress}
          onRetry={onRetryAnalysis}
          analysisDone={isAnalysisDone}
        />
        <View
          className="border-t border-cream-200 dark:border-stone-700 pt-4"
          accessibilityLabel="반응"
          accessibilityRole="none">
          <ReactionBar
            reactions={reactions}
            userReactedTypes={userReactedTypes}
            onReaction={onReaction}
            pendingTypes={pendingTypes}
          />
        </View>
        <RecommendedPosts posts={recommendedPosts} isLoading={recommendedPostsLoading} />
      </View>
    </View>
  );
}
