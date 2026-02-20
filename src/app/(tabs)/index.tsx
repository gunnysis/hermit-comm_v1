import React, { useState, useCallback, useEffect } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Container } from '@/shared/components/Container';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { SortTabs, type SortOrder } from '@/shared/components/SortTabs';
import { FloatingActionButton } from '@/shared/components/FloatingActionButton';
import { PostList } from '@/features/posts/components/PostList';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { api } from '@/shared/lib/api';
import { Post } from '@/types';
import { useBoardPosts } from '@/features/community/hooks/useBoardPosts';
import { getBoardPosts } from '@/features/community/api/communityApi';
import { useBoards } from '@/features/community/hooks/useBoards';
import { useRealtimePosts } from '@/features/posts/hooks/useRealtimePosts';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { useIsAdmin } from '@/features/admin/hooks/useIsAdmin';
import { Pressable } from 'react-native';

export default function HomeScreen() {
  const BOARD_ID = 1;
  const router = useRouter();
  useResponsiveLayout();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [posts, setPosts] = useState<Post[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const isSearchMode = searchQuery.length > 0;
  const { data: boards } = useBoards();

  const {
    data: queryData,
    isLoading: loading,
    error,
    refetch,
  } = useBoardPosts(BOARD_ID, sortOrder);

  useEffect(() => {
    if (queryData !== undefined) {
      setPosts(queryData);
      setOffset(queryData.length);
      setHasMore(queryData.length === 20);
    }
  }, [queryData]);

  useRealtimePosts({
    onInsert: useCallback((newPost: Post) => {
      setPosts((prev) => (prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev]));
    }, []),
    onDelete: useCallback((postId: number) => {
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    }, []),
    onUpdate: useCallback((updatedPost: Post) => {
      setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
    }, []),
  });

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading || isSearchMode) return;

    try {
      const result = await getBoardPosts(BOARD_ID, { limit: 20, offset, sortOrder });
      if (result.length < 20) {
        setHasMore(false);
      }
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = result.filter((p) => !existingIds.has(p.id));
        return newItems.length > 0 ? [...prev, ...newItems] : prev;
      });
      setOffset((prev) => prev + result.length);
    } catch {
      // 로드 실패 시 무시
    }
  }, [offset, hasMore, loading, sortOrder, isSearchMode]);

  const handleSearch = useCallback(async () => {
    const q = searchInput.trim();
    if (!q) {
      setSearchQuery('');
      refetch();
      return;
    }
    setSearchLoading(true);
    try {
      const result = await api.searchPosts(q, 50, 0);
      setSearchQuery(q);
      setPosts(result);
      setHasMore(false);
    } catch {
      // 검색 실패 시 무시
    } finally {
      setSearchLoading(false);
    }
  }, [searchInput, refetch]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    refetch();
  }, [refetch]);

  const handleRefresh = useCallback(async () => {
    if (isSearchMode) {
      handleSearch();
      return;
    }
    await refetch();
  }, [isSearchMode, handleSearch, refetch]);

  const adminButton =
    !isAdminLoading && isAdmin === true ? (
      <Pressable
        onPress={() => router.push('/admin' as Parameters<typeof router.push>[0])}
        className="ml-3 px-2 py-1.5 rounded-lg"
        accessibilityLabel="관리자 페이지">
        <Text className="text-xs font-semibold text-gray-600">관리자</Text>
      </Pressable>
    ) : undefined;

  const boardDescription = boards?.find((b) => b.id === BOARD_ID)?.description;

  return (
    <Container>
      <StatusBar style="dark" />
      <View className="flex-1 relative">
        <ScreenHeader
          title="은둔마을"
          subtitle="따뜻한 이야기가 있는 곳"
          rightContent={adminButton}>
          {boardDescription && (
            <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
              {boardDescription}
            </Text>
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

        <PostList
          posts={posts}
          loading={isSearchMode ? searchLoading : loading}
          error={error?.message ?? null}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          hasMore={!isSearchMode && hasMore}
        />

        <FloatingActionButton
          onPress={() => router.push('/create' as Parameters<typeof router.push>[0])}
          accessibilityLabel="새 글 작성"
        />
      </View>
    </Container>
  );
}
