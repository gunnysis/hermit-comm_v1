import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { Post } from '../../types';
import { PostCard } from './PostCard';
import { Loading } from '../common/Loading';
import { ErrorView } from '../common/ErrorView';

interface PostListProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onLoadMore?: () => void;
}

export function PostList({
  posts,
  loading,
  error,
  onRefresh,
  onLoadMore,
}: PostListProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  if (loading && posts.length === 0) {
    return <Loading skeleton />;
  }

  if (error && posts.length === 0) {
    return <ErrorView message={error} onRetry={onRefresh} />;
  }

  return (
    <FlatList
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
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading && posts.length > 0 ? (
          <View className="py-5">
            <Loading size="small" />
          </View>
        ) : null
      }
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
    />
  );
}
