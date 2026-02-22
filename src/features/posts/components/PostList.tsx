import React, { useState, useCallback, useRef, useEffect } from 'react';
import { RefreshControl, View, Pressable, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Post } from '@/types';
import { PostCard } from './PostCard';
import { PostCardSkeleton } from '@/shared/components/Skeleton';
import { Loading } from '@/shared/components/Loading';
import { ErrorView } from '@/shared/components/ErrorView';

interface PostListProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function PostList({
  posts,
  loading,
  error,
  onRefresh,
  onLoadMore,
  hasMore = true,
}: PostListProps) {
  const [refreshing, setRefreshing] = useState(false);
  const onEndReachedFired = useRef(false);
  const prevLoading = useRef(loading);

  useEffect(() => {
    if (prevLoading.current && !loading) onEndReachedFired.current = false;
    prevLoading.current = loading;
  }, [loading]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    onEndReachedFired.current = false;
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const handleEndReached = useCallback(() => {
    if (!onLoadMore || !hasMore || loading || onEndReachedFired.current) return;
    onEndReachedFired.current = true;
    onLoadMore();
  }, [onLoadMore, hasMore, loading]);

  const handleLoadMorePress = useCallback(() => {
    if (!onLoadMore || !hasMore || loading) return;
    onLoadMore();
  }, [onLoadMore, hasMore, loading]);

  const ListFooter = useCallback(() => {
    if (loading && posts.length > 0) {
      return (
        <View className="py-5">
          <Loading size="small" />
        </View>
      );
    }
    if (hasMore && posts.length > 0 && onLoadMore) {
      return (
        <View className="py-4 px-4">
          <Pressable
            onPress={handleLoadMorePress}
            className="py-3 rounded-xl bg-happy-400 active:opacity-80"
            accessibilityLabel="더 보기"
            accessibilityRole="button">
            <Text className="text-center font-semibold text-happy-700">더 보기</Text>
          </Pressable>
        </View>
      );
    }
    return null;
  }, [loading, hasMore, posts.length, onLoadMore, handleLoadMorePress]);

  if (loading && posts.length === 0) {
    return (
      <View className="p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <PostCardSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (error && posts.length === 0) {
    return <ErrorView message={error} onRetry={onRefresh} />;
  }

  return (
    <FlashList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <PostCard post={item} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#FFC300"
          colors={['#FFC300', '#FF7366', '#C39BFF']}
        />
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      onMomentumScrollBegin={() => {
        onEndReachedFired.current = false;
      }}
      ListFooterComponent={ListFooter}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
    />
  );
}
