import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { pushGroupCreate } from '@/shared/lib/navigation';
import { Container } from '@/shared/components/Container';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { SortTabs, type SortOrder } from '@/shared/components/SortTabs';
import { FloatingActionButton } from '@/shared/components/FloatingActionButton';
import { PostList } from '@/features/posts/components/PostList';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { Loading } from '@/shared/components/Loading';
import { ErrorView } from '@/shared/components/ErrorView';
import { useGroupBoards } from '@/features/community/hooks/useGroupBoards';
import { useGroupPosts } from '@/features/community/hooks/useGroupPosts';
import { searchGroupPosts } from '@/features/community/api/communityApi';
import type { Post } from '@/types';
import { useRealtimePosts } from '@/features/posts/hooks/useRealtimePosts';

export default function GroupBoardScreen() {
  const router = useRouter();
  const { groupId: groupIdParam } = useLocalSearchParams<{ groupId: string }>();
  const groupId = useMemo(() => Number(groupIdParam), [groupIdParam]);

  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedBoardIndex, setSelectedBoardIndex] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const isSearchMode = searchQuery.length > 0;

  const {
    data: boards,
    isLoading: boardsLoading,
    error: boardsError,
  } = useGroupBoards(Number.isNaN(groupId) ? null : groupId);

  const board = boards && boards.length > 0 ? (boards[selectedBoardIndex] ?? boards[0]) : null;
  const currentBoardId = board?.id ?? null;

  const {
    data: infiniteData,
    isLoading: postsLoading,
    error: postsError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGroupPosts(Number.isNaN(groupId) ? null : groupId, currentBoardId, sortOrder);

  useEffect(() => {
    if (infiniteData && !isSearchMode) {
      setPosts(infiniteData.pages.flat());
    }
  }, [infiniteData, isSearchMode]);

  useEffect(() => {
    setSearchInput('');
    setSearchQuery('');
  }, [selectedBoardIndex]);

  useRealtimePosts({
    onInsert: useCallback(
      (newPost: Post) => {
        if (newPost.group_id !== groupId) return;
        if (currentBoardId && newPost.board_id !== currentBoardId) return;
        if (isSearchMode) return;
        setPosts((prev) => (prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev]));
      },
      [groupId, currentBoardId, isSearchMode],
    ),
    onDelete: useCallback((postId: number) => {
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    }, []),
    onUpdate: useCallback((updatedPost: Post) => {
      setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
    }, []),
  });

  const loading = boardsLoading || postsLoading;
  const error = boardsError || postsError;

  const handleRefresh = useCallback(async () => {
    if (isSearchMode && currentBoardId) {
      setSearchLoading(true);
      try {
        const result = await searchGroupPosts(groupId, currentBoardId, searchQuery);
        setPosts(result);
      } catch {
        // 무시
      } finally {
        setSearchLoading(false);
      }
      return;
    }
    await refetch();
  }, [isSearchMode, currentBoardId, groupId, searchQuery, refetch]);

  const handleLoadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage || isSearchMode) return;
    await fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isSearchMode, fetchNextPage]);

  const handleSearch = useCallback(async () => {
    const q = searchInput.trim();
    if (!q) {
      setSearchQuery('');
      refetch();
      return;
    }
    if (!currentBoardId) return;
    setSearchLoading(true);
    try {
      const result = await searchGroupPosts(groupId, currentBoardId, q);
      setSearchQuery(q);
      setPosts(result);
    } catch {
      // 무시
    } finally {
      setSearchLoading(false);
    }
  }, [searchInput, currentBoardId, groupId, refetch]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    refetch();
  }, [refetch]);

  const handleCreatePost = useCallback(() => {
    if (currentBoardId) {
      pushGroupCreate(router, groupId, currentBoardId);
    }
  }, [router, groupId, currentBoardId]);

  if (!groupId || Number.isNaN(groupId)) {
    return (
      <Container>
        <StatusBar style="auto" />
        <ErrorView message="유효하지 않은 그룹입니다." onRetry={() => router.back()} />
      </Container>
    );
  }

  if (loading && posts.length === 0 && !isSearchMode) {
    return (
      <Container>
        <StatusBar style="auto" />
        <Loading message="그룹 게시판을 불러오는 중..." />
      </Container>
    );
  }

  if (error && posts.length === 0 && !isSearchMode) {
    return (
      <Container>
        <StatusBar style="auto" />
        <ErrorView message="그룹 게시판을 불러오지 못했습니다." onRetry={refetch} />
      </Container>
    );
  }

  const hasMultipleBoards = boards && boards.length > 1;

  return (
    <Container>
      <StatusBar style="auto" />
      <View className="flex-1 relative">
        <ScreenHeader
          title={board?.name ?? `그룹 #${groupId}`}
          subtitle={board?.description ?? undefined}
          showBack
          backLabel="← 내 그룹으로">
          {hasMultipleBoards && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3 -mx-1"
              contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}>
              {boards.map((b, index) => (
                <Pressable
                  key={b.id}
                  onPress={() => setSelectedBoardIndex(index)}
                  className={`px-4 py-2 rounded-xl ${
                    index === selectedBoardIndex
                      ? 'bg-happy-400'
                      : 'bg-white dark:bg-stone-800 border border-cream-200 dark:border-stone-600'
                  }`}
                  accessibilityLabel={`${b.name} 게시판`}
                  accessibilityRole="button">
                  <Text
                    className={`text-sm font-semibold ${
                      index === selectedBoardIndex
                        ? 'text-white'
                        : 'text-gray-600 dark:text-stone-300'
                    }`}>
                    {b.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View className="flex-row items-center gap-2 mt-3">
            <View className="flex-1">
              <Input
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="제목·내용 검색"
                className="mb-0"
                accessibilityLabel="게시글 검색"
                onSubmitEditing={handleSearch}
              />
            </View>
            <Button
              title={isSearchMode ? '취소' : '검색'}
              onPress={isSearchMode ? handleClearSearch : handleSearch}
              loading={searchLoading && !isSearchMode}
              disabled={searchLoading}
              size="sm"
              accessibilityLabel={isSearchMode ? '검색 취소' : '검색'}
            />
          </View>

          <SortTabs value={sortOrder} onChange={setSortOrder} />
        </ScreenHeader>

        {!board && !loading && !error ? (
          <View className="flex-1 items-center justify-center px-6 py-10">
            <Text className="text-sm text-gray-500 dark:text-stone-400 text-center">
              아직 이 그룹에는 게시판이 없습니다.{'\n'}운영자가 게시판을 생성하면 이곳에서 글을 볼
              수 있어요.
            </Text>
          </View>
        ) : (
          <PostList
            posts={posts}
            loading={isSearchMode ? searchLoading : loading}
            error={error ? '게시글을 불러오지 못했습니다.' : null}
            onRefresh={handleRefresh}
            onLoadMore={handleLoadMore}
            hasMore={!isSearchMode && !!hasNextPage}
            emptyTitle="이 그룹에 아직 글이 없어요"
            emptyDescription="첫 글을 남겨보세요."
          />
        )}

        {board && (
          <FloatingActionButton onPress={handleCreatePost} accessibilityLabel="그룹 게시글 작성" />
        )}
      </View>
    </Container>
  );
}
