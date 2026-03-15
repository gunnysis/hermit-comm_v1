import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Container } from '@/shared/components/Container';
import {
  DEFAULT_PUBLIC_BOARD_ID,
  EMPTY_STATE_MESSAGES,
  GREETING_MESSAGES,
} from '@/shared/lib/constants';
import { pushAdmin, pushAdminLogin, pushSearch, pushCreate } from '@/shared/lib/navigation';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { SortTabs, type SortOrder } from '@/shared/components/SortTabs';
import { FloatingActionButton } from '@/shared/components/FloatingActionButton';
import { PostList } from '@/features/posts/components/PostList';
import { EmotionTrend } from '@/features/posts/components/EmotionTrend';
import { EmotionFilterBar } from '@/features/posts/components/EmotionFilterBar';
import { TrendingPosts } from '@/features/posts/components/TrendingPosts';
import { useBoardPosts } from '@/features/boards/hooks/useBoardPosts';
import { useRealtimePosts } from '@/features/posts/hooks/useRealtimePosts';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { useIsAdmin } from '@/features/admin/hooks/useIsAdmin';
import { useBlockedAliases } from '@/features/blocks/hooks/useBlocks';
import { api } from '@/shared/lib/api';
import { HomeCheckinBanner } from '@/shared/components/HomeCheckinBanner';
import { YesterdayReactionBanner } from '@/shared/components/YesterdayReactionBanner';
import { NotificationBell } from '@/shared/components/NotificationBell';
import * as Haptics from 'expo-haptics';
import type { Post } from '@/types';

type TimeSlot = keyof typeof GREETING_MESSAGES;

function getTimeSlot(): TimeSlot {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export default function HomeScreen() {
  const router = useRouter();
  useResponsiveLayout();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [emotionFilter, setEmotionFilter] = useState<string | null>(null);
  const { data: blockedAliases = [] } = useBlockedAliases();

  const greeting = useMemo(() => GREETING_MESSAGES[getTimeSlot()].greeting, []);

  const {
    data,
    isLoading: loading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBoardPosts(DEFAULT_PUBLIC_BOARD_ID, sortOrder);

  const { data: filteredPosts, isLoading: isFilterLoading } = useQuery({
    queryKey: ['postsByEmotion', emotionFilter],
    queryFn: () => api.getPostsByEmotion(emotionFilter!, 50, 0),
    enabled: !!emotionFilter,
  });

  const posts = useMemo(() => {
    const raw = emotionFilter
      ? ((filteredPosts ?? []) as Post[])
      : ((data?.pages.flatMap((p: Post[]) => p) ?? []) as Post[]);
    if (blockedAliases.length === 0) return raw;
    return raw.filter((p) => !blockedAliases.includes(p.display_name));
  }, [emotionFilter, filteredPosts, data?.pages, blockedAliases]);

  const isLoading = emotionFilter ? isFilterLoading : loading;

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
    if (!emotionFilter && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [emotionFilter, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleEmotionSelect = useCallback((emotion: string | null) => {
    setEmotionFilter(emotion);
  }, []);

  const handleTitleLongPress = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    pushAdminLogin(router);
  }, [router]);

  const rightContent = useMemo(
    () => (
      <View className="flex-row items-center">
        <NotificationBell />
        {!isAdminLoading && isAdmin === true && (
          <Pressable
            onPress={() => pushAdmin(router)}
            className="ml-1 px-2 py-1.5 rounded-lg"
            accessibilityLabel="관리자 페이지">
            <Text className="text-xs font-semibold text-gray-600 dark:text-stone-400">관리자</Text>
          </Pressable>
        )}
      </View>
    ),
    [isAdminLoading, isAdmin, router],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <YesterdayReactionBanner />
        <HomeCheckinBanner />
        <View className="px-4">
          <EmotionTrend
            days={7}
            selectedEmotion={emotionFilter}
            onEmotionSelect={handleEmotionSelect}
          />
        </View>
        <EmotionFilterBar selected={emotionFilter} onSelect={handleEmotionSelect} />
        {!emotionFilter && (
          <View className="px-4">
            <TrendingPosts />
          </View>
        )}
      </View>
    ),
    [emotionFilter, handleEmotionSelect],
  );

  const emptyTitle = emotionFilter
    ? `'${emotionFilter}' 감정의 글이 아직 없어요`
    : EMPTY_STATE_MESSAGES.feed.title;
  const emptyDescription = emotionFilter
    ? '다른 감정을 선택해보세요'
    : EMPTY_STATE_MESSAGES.feed.description;

  return (
    <Container>
      <StatusBar style="auto" />
      <View className="flex-1 relative">
        <ScreenHeader
          title="은둔마을"
          greeting={greeting}
          rightContent={rightContent}
          onTitleLongPress={handleTitleLongPress}>
          <View className="flex-row items-center gap-2 mt-2">
            <Pressable
              onPress={() => pushSearch(router)}
              className="flex-1 flex-row items-center rounded-xl border border-cream-200 dark:border-stone-600 bg-cream-50 dark:bg-stone-800 px-3 py-2"
              accessibilityLabel="검색"
              accessibilityRole="button"
              accessibilityHint="검색 화면으로 이동합니다">
              <Text className="text-sm text-gray-500 dark:text-stone-400">검색</Text>
            </Pressable>
          </View>
          {!emotionFilter && <SortTabs value={sortOrder} onChange={setSortOrder} />}
          {emotionFilter && (
            <View className="flex-row items-center mt-2 gap-2">
              <Text className="text-sm text-gray-600 dark:text-stone-300">
                {`'${emotionFilter}' 감정의 이야기들`}
              </Text>
              <Pressable
                onPress={() => setEmotionFilter(null)}
                className="px-2 py-1 rounded-full bg-stone-200 dark:bg-stone-700 active:opacity-70"
                accessibilityLabel="필터 해제">
                <Text className="text-xs text-stone-600 dark:text-stone-300">전체 보기</Text>
              </Pressable>
            </View>
          )}
        </ScreenHeader>

        <PostList
          posts={posts}
          loading={isLoading || isFetchingNextPage}
          error={error?.message ?? null}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          hasMore={!emotionFilter && !!hasNextPage}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          listHeader={listHeader}
        />

        <FloatingActionButton onPress={() => pushCreate(router)} accessibilityLabel="새 글 작성" />
      </View>
    </Container>
  );
}
