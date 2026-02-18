import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Container } from '@/shared/components/Container';
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

type SortOrder = 'latest' | 'popular';

export default function HomeScreen() {
  const BOARD_ID = 1;
  const router = useRouter();
  const { isWide } = useResponsiveLayout();
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

  // 실시간 게시글 업데이트 구독
  useRealtimePosts({
    onInsert: useCallback((newPost: Post) => {
      // 이미 있으면 추가하지 않음 (중복 key 방지)
      setPosts((prev) => (prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev]));
    }, []),
    onDelete: useCallback((postId: number) => {
      // 삭제된 게시글을 목록에서 제거
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    }, []),
    onUpdate: useCallback((updatedPost: Post) => {
      // 업데이트된 게시글 반영
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
    } catch (e) {
      console.error('게시글 로드 실패:', e);
    }
  }, [offset, hasMore, loading, sortOrder, isSearchMode, BOARD_ID]);

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
    } catch (e) {
      console.error('검색 실패:', e);
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

  return (
    <Container>
      <StatusBar style="dark" />

      {/* 행복한 헤더 */}
      <View
        className={`bg-happy-100 px-4 ${isWide ? 'pt-6' : 'pt-12'} pb-6 border-b border-cream-200 shadow-sm`}>
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center">
              <Text className="text-3xl mr-2">🏡</Text>
              <Text className="text-3xl font-bold text-gray-800">은둔마을</Text>
            </View>
            <Text className="text-sm text-gray-600 mt-2">따뜻한 이야기가 있는 곳</Text>
          </View>
          <Pressable
            onPress={() => router.push('/groups')}
            className="px-3 py-2 bg-happy-200 rounded-xl"
            accessibilityLabel="내 그룹">
            <Text className="text-sm font-semibold text-gray-700">내 그룹</Text>
          </Pressable>
        </View>
        {(() => {
          const board = boards?.find((b) => b.id === BOARD_ID);
          if (!board?.description) return null;
          return (
            <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
              {board.description}
            </Text>
          );
        })()}
        <View className="flex-row items-center gap-2 mt-3">
          <View className="flex-1">
            <Input
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="제목·내용 검색"
              className="mb-0"
              accessibilityLabel="게시글 검색"
              accessibilityHint="제목 또는 내용으로 검색합니다"
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
            accessibilityHint={
              isSearchMode
                ? '검색을 취소하고 목록을 다시 불러옵니다'
                : '입력한 단어로 게시글을 검색합니다'
            }
          />
        </View>
        <View className="flex-row mt-3 gap-2">
          <Pressable
            onPress={() => setSortOrder('latest')}
            className={`flex-1 py-2 rounded-xl ${sortOrder === 'latest' ? 'bg-happy-400' : 'bg-white border border-cream-200'}`}
            accessibilityLabel="최신순 정렬"
            accessibilityRole="button">
            <Text
              className={`text-center font-semibold ${sortOrder === 'latest' ? 'text-white' : 'text-gray-600'}`}>
              최신순
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortOrder('popular')}
            className={`flex-1 py-2 rounded-xl ${sortOrder === 'popular' ? 'bg-happy-400' : 'bg-white border border-cream-200'}`}
            accessibilityLabel="인기순 정렬"
            accessibilityRole="button">
            <Text
              className={`text-center font-semibold ${sortOrder === 'popular' ? 'text-white' : 'text-gray-600'}`}>
              인기순
            </Text>
          </Pressable>
        </View>
      </View>

      <PostList
        posts={posts}
        loading={isSearchMode ? searchLoading : loading}
        error={error?.message ?? null}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        hasMore={!isSearchMode && hasMore}
      />
    </Container>
  );
}
