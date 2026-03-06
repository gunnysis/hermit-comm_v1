import React from 'react';
import { View, Text } from 'react-native';
import { PostBody } from './PostBody';
import { EmotionTags } from './EmotionTags';
import { ReactionBar } from './ReactionBar';
import { RecommendedPosts } from './RecommendedPosts';
import { formatDate } from '@/shared/utils/format';
import type { Post, Reaction, RecommendedPost, AnalysisStatus } from '@/types';

interface PostDetailBodyProps {
  post: Post;
  postAnalysis:
    | { emotions: string[]; status?: AnalysisStatus; retry_count?: number }
    | undefined
    | null;
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
    <View className="mx-3 mt-3 rounded-xl border border-cream-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-md overflow-hidden">
      <View className="p-3.5">
        <Text className="text-xl font-bold text-gray-800 dark:text-stone-100 mb-2">
          {post.title}
        </Text>
        <View className="flex-row justify-between items-center mb-3">
          <View className="bg-happy-100 dark:bg-happy-900/40 px-2.5 py-1 rounded-full">
            <Text className="text-sm font-semibold text-happy-700 dark:text-happy-300">
              {post.display_name}
            </Text>
          </View>
          <Text className="text-xs text-gray-400 dark:text-stone-500">
            {formatDate(post.created_at)}
          </Text>
        </View>
        <View className="mb-4" accessibilityLabel="게시글 본문">
          <PostBody content={post.content} imageUrl={post.image_url} />
        </View>
        <EmotionTags
          emotions={postAnalysis?.emotions ?? []}
          isLoading={analysisLoading && postAnalysis == null}
          onPress={onEmotionPress}
          onRetry={onRetryAnalysis}
          analysisDone={isAnalysisDone}
          analysisStatus={postAnalysis?.status}
          retryCount={postAnalysis?.retry_count}
        />
        <View
          className="border-t border-cream-200 dark:border-stone-700 pt-3"
          accessibilityLabel="반응"
          accessibilityRole="none">
          <ReactionBar
            reactions={reactions}
            userReactedTypes={userReactedTypes}
            onReaction={onReaction}
            pendingTypes={pendingTypes}
          />
        </View>
        <RecommendedPosts
          posts={recommendedPosts}
          isLoading={recommendedPostsLoading}
          hasEmotions={(postAnalysis?.emotions?.length ?? 0) > 0}
        />
      </View>
    </View>
  );
}
