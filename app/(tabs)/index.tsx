import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Container } from '../../components/common/Container';
import { PostList } from '../../components/posts/PostList';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { api } from '../../lib/api';
import { Post } from '../../types';
import { useAPI } from '../../hooks/useAPI';
import { useRealtimePosts } from '../../hooks/useRealtimePosts';

type SortOrder = 'latest' | 'popular';

export default function HomeScreen() {
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [posts, setPosts] = useState<Post[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const isSearchMode = searchQuery.length > 0;

  const fetchPosts = useCallback(
    async (limit: number, fromOffset: number) => {
      return api.getPosts(limit, fromOffset, sortOrder);
    },
    [sortOrder]
  );

  const fetcher = useCallback(async () => {
    const result = await fetchPosts(20, 0);
    setPosts(result);
    setOffset(20);
    setHasMore(result.length === 20);
    return result;
  }, [fetchPosts]);

  const { loading, error, refetch } = useAPI(fetcher);
  const prevSortRef = useRef<SortOrder>(sortOrder);

  useEffect(() => {
    if (prevSortRef.current !== sortOrder) {
      prevSortRef.current = sortOrder;
      refetch();
    }
  }, [sortOrder, refetch]);

  // 실시간 게시글 업데이트 구독
  useRealtimePosts({
    onInsert: useCallback((newPost: Post) => {
      // 이미 있으면 추가하지 않음 (중복 key 방지)
      setPosts((prev) =>
        prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev]
      );
    }, []),
    onDelete: useCallback((postId: number) => {
      // 삭제된 게시글을 목록에서 제거
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    }, []),
    onUpdate: useCallback((updatedPost: Post) => {
      // 업데이트된 게시글 반영
      setPosts((prev) =>
        prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
      );
    }, []),
  });

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading || isSearchMode) return;

    try {
      const result = await fetchPosts(20, offset);
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
  }, [offset, hasMore, loading, fetchPosts, isSearchMode]);

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
    try {
      const result = await fetchPosts(20, 0);
      setPosts(result);
      setOffset(20);
      setHasMore(result.length === 20);
    } catch (error) {
      console.error('[HomeScreen] 새로고침 실패:', error);
    }
  }, [fetchPosts, isSearchMode, handleSearch]);

  return (
    <Container>
      <StatusBar style="dark" />
      
      {/* 행복한 헤더 */}
      <View className="bg-happy-100 px-4 pt-12 pb-6 border-b border-cream-200 shadow-sm">
        <View className="flex-row items-center">
          <Text className="text-3xl mr-2">🏡</Text>
          <Text className="text-3xl font-bold text-gray-800">
            은둔마을
          </Text>
        </View>
        <Text className="text-sm text-gray-600 mt-2">
          따뜻한 이야기가 있는 곳
        </Text>
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
            accessibilityHint={isSearchMode ? '검색을 취소하고 목록을 다시 불러옵니다' : '입력한 단어로 게시글을 검색합니다'}
          />
        </View>
        <View className="flex-row mt-3 gap-2">
          <Pressable
            onPress={() => setSortOrder('latest')}
            className={`flex-1 py-2 rounded-xl ${sortOrder === 'latest' ? 'bg-happy-400' : 'bg-white border border-cream-200'}`}
            accessibilityLabel="최신순 정렬"
            accessibilityRole="button"
          >
            <Text
              className={`text-center font-semibold ${sortOrder === 'latest' ? 'text-white' : 'text-gray-600'}`}
            >
              최신순
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortOrder('popular')}
            className={`flex-1 py-2 rounded-xl ${sortOrder === 'popular' ? 'bg-happy-400' : 'bg-white border border-cream-200'}`}
            accessibilityLabel="인기순 정렬"
            accessibilityRole="button"
          >
            <Text
              className={`text-center font-semibold ${sortOrder === 'popular' ? 'text-white' : 'text-gray-600'}`}
            >
              인기순
            </Text>
          </Pressable>
        </View>
      </View>

      <PostList
        posts={posts}
        loading={isSearchMode ? searchLoading : loading}
        error={error}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        hasMore={!isSearchMode && hasMore}
      />
    </Container>
  );
}
