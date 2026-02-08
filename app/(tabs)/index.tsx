import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Container } from '../../components/common/Container';
import { PostList } from '../../components/posts/PostList';
import { api } from '../../lib/api';
import { Post } from '../../types';
import { useAPI } from '../../hooks/useAPI';
import { useRealtimePosts } from '../../hooks/useRealtimePosts';

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { loading, error, refetch } = useAPI(
    async () => {
      const result = await api.getPosts(20, 0);
      setPosts(result);
      setOffset(20);
      setHasMore(result.length === 20);
      return result;
    }
  );

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

  const handleRefresh = useCallback(async () => {
    try {
      const result = await api.getPosts(20, 0);
      setPosts(result);
      setOffset(20);
      setHasMore(result.length === 20);
    } catch (error) {
      console.error('[HomeScreen] 새로고침 실패:', error);
    }
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    try {
      const result = await api.getPosts(20, offset);
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
  }, [offset, hasMore, loading]);

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
      </View>

      <PostList
        posts={posts}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
      />
    </Container>
  );
}
