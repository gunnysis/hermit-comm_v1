import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { PostBody } from './PostBody';
import { EmotionTags } from './EmotionTags';
import { ReactionBar } from './ReactionBar';
import { RecommendedPosts } from './RecommendedPosts';
import { formatDate } from '@/shared/utils/format';
import { EMOTION_COLOR_MAP, EMOTION_EMOJI, ACTIVITY_PRESETS } from '@/shared/lib/constants';
import type { Post, Reaction, RecommendedPost, AnalysisStatus } from '@/types';

interface PostDetailBodyProps {
  post: Post;
  postAnalysis:
    | {
        emotions: string[];
        status?: AnalysisStatus;
        retry_count?: number;
        error_reason?: string | null;
      }
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
  /** 재시도 중 여부 */
  isRetryingAnalysis?: boolean;
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
  isRetryingAnalysis = false,
}: PostDetailBodyProps) {
  const isAnalysisDone = !analysisLoading && postAnalysis !== undefined;

  // Daily 전용 레이아웃
  if (post.post_type === 'daily') {
    const emotions = postAnalysis?.emotions ?? post.initial_emotions ?? [];
    const activities = post.activities ?? [];
    const content = post.content || '';

    return (
      <View className="mx-3 mt-3 rounded-xl border border-cream-200 dark:border-stone-700 bg-cream-50 dark:bg-stone-800/50 shadow-md overflow-hidden">
        <View className="p-3.5">
          {/* 헤더 */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-medium text-stone-500 dark:text-stone-400">
              🌤️ 오늘의 하루
            </Text>
            <Text className="text-xs text-gray-400 dark:text-stone-500">
              {formatDate(post.created_at)}
            </Text>
          </View>

          {/* 감정 칩 (크게) */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            {emotions.map((emotion: string) => {
              const colors = EMOTION_COLOR_MAP[emotion];
              return (
                <Pressable
                  key={emotion}
                  onPress={() => onEmotionPress?.(emotion)}
                  className="rounded-full px-4 py-2"
                  style={{ backgroundColor: colors?.gradient[0] ?? '#E7D7FF' }}>
                  <Text className="text-sm font-semibold" style={{ color: '#1c1917' }}>
                    {EMOTION_EMOJI[emotion] ?? '💬'} {emotion}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 활동 태그 */}
          {activities.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-3">
              {activities.map((act: string) => {
                const preset = ACTIVITY_PRESETS.find((p) => p.id === act);
                return (
                  <View
                    key={act}
                    className="rounded-full px-3 py-1.5 border border-stone-300 dark:border-stone-600">
                    <Text className="text-xs text-stone-600 dark:text-stone-400">
                      {preset ? `${preset.icon} ${preset.name}` : act}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* 한마디 */}
          {content.length > 0 && (
            <Text className="text-base text-stone-700 dark:text-stone-300 mb-3">
              &quot;{content}&quot;
            </Text>
          )}

          {/* ReactionBar + RecommendedPosts */}
          <View
            className="border-t border-cream-200 dark:border-stone-700 pt-3"
            accessibilityLabel="반응">
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
            hasEmotions={emotions.length > 0}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="mx-3 mt-3 rounded-xl border border-cream-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-md overflow-hidden">
      <View className="p-3.5">
        <Text className="text-xl font-bold text-gray-800 dark:text-stone-100 mb-2">
          {post.title}
        </Text>
        <View className="flex-row justify-between items-center mb-3">
          <View className="bg-happy-100 dark:bg-happy-900/40 px-2.5 py-1 rounded-full flex-shrink max-w-[60%]">
            <Text className="text-sm font-semibold text-happy-700 dark:text-happy-300 truncate">
              {post.display_name}
            </Text>
          </View>
          <Text className="text-xs text-gray-400 dark:text-stone-500 flex-shrink-0">
            {formatDate(post.created_at)}
          </Text>
        </View>
        <View className="mb-4" accessibilityLabel="게시글 본문">
          <PostBody content={post.content} />
        </View>
        <EmotionTags
          emotions={postAnalysis?.emotions ?? []}
          isLoading={analysisLoading && postAnalysis == null}
          onPress={onEmotionPress}
          onRetry={onRetryAnalysis}
          analysisDone={isAnalysisDone}
          analysisStatus={postAnalysis?.status}
          retryCount={postAnalysis?.retry_count}
          isRetrying={isRetryingAnalysis}
          errorReason={postAnalysis?.error_reason}
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
