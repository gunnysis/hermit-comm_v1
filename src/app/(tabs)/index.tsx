import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Container } from '@/shared/components/Container';
import { DEFAULT_PUBLIC_BOARD_ID, EMPTY_STATE_MESSAGES } from '@/shared/lib/constants';
import { pushAdmin, pushSearch, pushCreate } from '@/shared/lib/navigation';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { SortTabs, type SortOrder } from '@/shared/components/SortTabs';
import { FloatingActionButton } from '@/shared/components/FloatingActionButton';
import { PostList } from '@/features/posts/components/PostList';
import { EmotionTrend } from '@/features/posts/components/EmotionTrend';
import { TrendingPosts } from '@/features/posts/components/TrendingPosts';
import { GreetingBanner } from '@/features/posts/components/GreetingBanner';
import { useBoardPosts } from '@/features/community/hooks/useBoardPosts';
import { useBoards } from '@/features/community/hooks/useBoards';
import { useRealtimePosts } from '@/features/posts/hooks/useRealtimePosts';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { useIsAdmin } from '@/features/admin/hooks/useIsAdmin';
import type { Post } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  useResponsiveLayout();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const { data: boards } = useBoards();

  const {
    data,
    isLoading: loading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBoardPosts(DEFAULT_PUBLIC_BOARD_ID, sortOrder);

  const posts = useMemo(
    () => (data?.pages.flatMap((p: Post[]) => p) ?? []) as Post[],
    [data?.pages],
  );

  useRealtimePosts({
    onInsert: useCallback(
      (_newPost: Post) => {
        refetch();
      },
      [refetch],
    ),
    onDelete: useCallback(() => {
      refetch();
    }, [refetch]),
    onUpdate: useCallback(() => {
      refetch();
    }, [refetch]),
  });

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const adminButton =
    !isAdminLoading && isAdmin === true ? (
      <Pressable
        onPress={() => pushAdmin(router)}
        className="ml-3 px-2 py-1.5 rounded-lg"
        accessibilityLabel="관리자 페이지">
        <Text className="text-xs font-semibold text-gray-600 dark:text-stone-400">관리자</Text>
      </Pressable>
    ) : undefined;

  const boardDescription = boards?.find((b) => b.id === DEFAULT_PUBLIC_BOARD_ID)?.description;

  return (
    <Container>
      <StatusBar style="auto" />
      <View className="flex-1 relative">
        <ScreenHeader
          title="은둔마을"
          subtitle="따뜻한 이야기가 있는 곳"
          rightContent={adminButton}>
          {boardDescription && (
            <Text className="text-xs text-gray-500 dark:text-stone-400 mt-1" numberOfLines={2}>
              {boardDescription}
            </Text>
          )}
          <View className="flex-row items-center gap-2 mt-3">
            <Pressable
              onPress={() => pushSearch(router)}
              className="flex-1 flex-row items-center rounded-2xl border-2 border-cream-200 dark:border-stone-600 bg-cream-50 dark:bg-stone-800 px-4 py-3"
              accessibilityLabel="검색"
              accessibilityRole="button"
              accessibilityHint="검색 화면으로 이동합니다">
              <Text className="text-base text-gray-500 dark:text-stone-400">🔍 제목·내용 검색</Text>
            </Pressable>
          </View>
          <SortTabs value={sortOrder} onChange={setSortOrder} />
        </ScreenHeader>

        <GreetingBanner />
        <View className="px-4">
          <EmotionTrend days={7} />
          <TrendingPosts />
        </View>

        <PostList
          posts={posts}
          loading={loading || isFetchingNextPage}
          error={error?.message ?? null}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          hasMore={!!hasNextPage}
          emptyTitle={EMPTY_STATE_MESSAGES.feed.title}
          emptyDescription={EMPTY_STATE_MESSAGES.feed.description}
        />

        <FloatingActionButton onPress={() => pushCreate(router)} accessibilityLabel="새 글 작성" />
      </View>
    </Container>
  );
}
