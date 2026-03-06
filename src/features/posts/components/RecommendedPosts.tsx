import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { pushPost } from '@/shared/lib/navigation';
import type { RecommendedPost } from '@/types';

interface RecommendedPostsProps {
  posts: RecommendedPost[];
  isLoading: boolean;
  hasEmotions?: boolean;
}

/** 추천 게시글 카드 하나 */
function RecommendedPostCard({ post }: { post: RecommendedPost }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => pushPost(router, post.id)}
      className="w-40 mr-2.5 p-2.5 rounded-xl bg-cream-50 dark:bg-stone-800 border border-cream-200 dark:border-stone-700 active:opacity-80"
      accessibilityLabel={`추천 게시글: ${post.title}`}
      accessibilityRole="button">
      {/* 제목 (최대 2줄) */}
      <Text
        className="text-sm font-semibold text-gray-800 dark:text-stone-100 mb-2"
        numberOfLines={2}>
        {post.title}
      </Text>

      {/* 감정 태그 (최대 2개) */}
      {post.emotions?.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mb-2">
          {post.emotions.slice(0, 2).map((emotion) => (
            <View key={emotion} className="rounded-full bg-stone-100 dark:bg-stone-700 px-2 py-0.5">
              <Text className="text-xs text-stone-500 dark:text-stone-400">{emotion}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 좋아요 / 댓글 수 */}
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

/**
 * 비슷한 감정의 추천 게시글 섹션.
 * 추천 데이터가 없거나 로딩 중이면 아무것도 렌더링하지 않습니다.
 */
export function RecommendedPosts({ posts, isLoading, hasEmotions = true }: RecommendedPostsProps) {
  if (isLoading || !posts || posts.length === 0) {
    return null;
  }

  const headerText = hasEmotions ? '비슷한 감정의 글' : '다른 인기 글';

  return (
    <View className="mt-3">
      <Text className="text-sm font-bold text-gray-700 dark:text-stone-200 mb-2 px-1">
        {headerText}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}>
        {posts.map((post) => (
          <RecommendedPostCard key={post.id} post={post} />
        ))}
      </ScrollView>
    </View>
  );
}
