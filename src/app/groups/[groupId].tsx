import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Container } from '@/shared/components/Container';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { SortTabs, type SortOrder } from '@/shared/components/SortTabs';
import { FloatingActionButton } from '@/shared/components/FloatingActionButton';
import { PostList } from '@/features/posts/components/PostList';
import { Loading } from '@/shared/components/Loading';
import { ErrorView } from '@/shared/components/ErrorView';
import { useGroupBoards } from '@/features/community/hooks/useGroupBoards';
import { useGroupPosts } from '@/features/community/hooks/useGroupPosts';
import { getGroupPosts } from '@/features/community/api/communityApi';
import type { Post } from '@/types';
import { useRealtimePosts } from '@/features/posts/hooks/useRealtimePosts';

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

  const board = boards && boards.length > 0 ? boards[0] : null;
  const defaultBoardId = board?.id ?? null;

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
    onInsert: useCallback(
      (newPost: Post) => {
        if (newPost.group_id !== groupId) return;
        setPosts((prev) =>
          prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev],
        );
      },
      [groupId],
    ),
    onDelete: useCallback((postId: number) => {
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    }, []),
    onUpdate: useCallback((updatedPost: Post) => {
      setPosts((prev) =>
        prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
      );
    }, []),
  });

  const loading = boardsLoading || postsLoading;
  const error = boardsError || postsError;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading || !defaultBoardId || !groupId) return;

    try {
      const result = await getGroupPosts(groupId, defaultBoardId, {
        sortOrder,
        limit: 20,
        offset,
      });
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
      setHasMore(false);
    }
  }, [hasMore, loading, defaultBoardId, groupId, sortOrder, offset]);

  const handleCreatePost = useCallback(() => {
    if (defaultBoardId) {
      router.push(
        `/groups/create?groupId=${groupId}&boardId=${defaultBoardId}` as Parameters<
          typeof router.push
        >[0],
      );
    }
  }, [router, groupId, defaultBoardId]);

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

  return (
    <Container>
      <StatusBar style="dark" />
      <View className="flex-1 relative">
        <ScreenHeader
          title={board?.name ?? `그룹 #${groupId}`}
          subtitle={board?.description ?? undefined}
          showBack
          backLabel="← 내 그룹으로">
          <SortTabs value={sortOrder} onChange={setSortOrder} />
        </ScreenHeader>

        {!board && !loading && !error ? (
          <View className="flex-1 items-center justify-center px-6 py-10">
            <Text className="text-sm text-gray-500 text-center">
              아직 이 그룹에는 게시판이 없습니다.{'\n'}운영자가 게시판을 생성하면 이곳에서
              글을 볼 수 있어요.
            </Text>
          </View>
        ) : (
          <PostList
            posts={posts}
            loading={loading}
            error={error ? '게시글을 불러오지 못했습니다.' : null}
            onRefresh={handleRefresh}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
          />
        )}

        {board && (
          <FloatingActionButton
            onPress={handleCreatePost}
            accessibilityLabel="그룹 게시글 작성"
          />
        )}
      </View>
    </Container>
  );
}
