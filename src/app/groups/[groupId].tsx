import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Container } from '@/shared/components/Container';
import { PostList } from '@/features/posts/components/PostList';
import { Loading } from '@/shared/components/Loading';
import { ErrorView } from '@/shared/components/ErrorView';
import { useGroupBoards } from '@/features/community/hooks/useGroupBoards';
import { useGroupPosts } from '@/features/community/hooks/useGroupPosts';
import type { Post } from '@/types';
import { useRealtimePosts } from '@/features/posts/hooks/useRealtimePosts';

type SortOrder = 'latest' | 'popular';

export default function GroupBoardScreen() {
  const router = useRouter();
  const { groupId: groupIdParam } = useLocalSearchParams<{ groupId: string }>();
  const groupId = useMemo(() => Number(groupIdParam), [groupIdParam]);

  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [posts, setPosts] = useState<Post[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const {
    data: boards,
    isLoading: boardsLoading,
    error: boardsError,
  } = useGroupBoards(Number.isNaN(groupId) ? null : groupId);

  const defaultBoardId = boards && boards.length > 0 ? boards[0].id : null;

  const {
    data: queryData,
    isLoading: postsLoading,
    error: postsError,
    refetch,
  } = useGroupPosts(Number.isNaN(groupId) ? null : groupId, defaultBoardId, sortOrder);

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

  const loading = boardsLoading || postsLoading;
  const error = boardsError || postsError;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading || !defaultBoardId || !groupId) return;
    // 간단 구현: 현재는 추가 로드 없이 첫 페이지 데이터만 사용
    setHasMore(false);
  }, [hasMore, loading, defaultBoardId, groupId]);

  if (!groupId || Number.isNaN(groupId)) {
    return (
      <Container>
        <StatusBar style="dark" />
        <ErrorView message="유효하지 않은 그룹입니다." onRetry={() => router.back()} />
      </Container>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <Container>
        <StatusBar style="dark" />
        <Loading message="그룹 게시판을 불러오는 중..." />
      </Container>
    );
  }

  if (error && posts.length === 0) {
    return (
      <Container>
        <StatusBar style="dark" />
        <ErrorView message="그룹 게시판을 불러오지 못했습니다." onRetry={refetch} />
      </Container>
    );
  }

  const board = boards && boards.length > 0 ? boards[0] : null;

  return (
    <Container>
      <StatusBar style="dark" />
      <View className="bg-lavender-100 px-4 pt-12 pb-6 border-b border-cream-200 shadow-sm">
        <Pressable
          onPress={() => router.back()}
          className="p-1 -ml-1 mb-2 active:opacity-70"
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button">
          <Text className="text-sm text-happy-700 font-semibold">{'← 내 그룹으로'}</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-gray-800 mb-1">
          그룹 #{groupId}
          {board ? ` · ${board.name}` : ''}
        </Text>
        {board?.description && (
          <Text className="text-xs text-gray-600" numberOfLines={2}>
            {board.description}
          </Text>
        )}
        <View className="flex-row mt-3 gap-2">
          <Pressable
            onPress={() => setSortOrder('latest')}
            className={`flex-1 py-2 rounded-xl ${
              sortOrder === 'latest' ? 'bg-happy-400' : 'bg-white border border-cream-200'
            }`}
            accessibilityLabel="최신순 정렬"
            accessibilityRole="button">
            <Text
              className={`text-center font-semibold ${
                sortOrder === 'latest' ? 'text-white' : 'text-gray-600'
              }`}>
              최신순
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortOrder('popular')}
            className={`flex-1 py-2 rounded-xl ${
              sortOrder === 'popular' ? 'bg-happy-400' : 'bg-white border border-cream-200'
            }`}
            accessibilityLabel="인기순 정렬"
            accessibilityRole="button">
            <Text
              className={`text-center font-semibold ${
                sortOrder === 'popular' ? 'text-white' : 'text-gray-600'
              }`}>
              인기순
            </Text>
          </Pressable>
        </View>
      </View>

      <PostList
        posts={posts}
        loading={loading}
        error={error ? '게시글을 불러오지 못했습니다.' : null}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
      />
    </Container>
  );
}

