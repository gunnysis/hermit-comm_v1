import React from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { PostCardSkeleton } from '@/shared/components/primitives/Skeleton';
import { SearchResultCard } from './SearchResultCard';
import { useTabBarHeight } from '@/shared/hooks/useTabBarHeight';
import type { SearchResult } from '@/types';

export function SearchResultList({
  results,
  onEndReached,
  isFetchingMore,
}: {
  results: SearchResult[];
  onEndReached: () => void;
  isFetchingMore: boolean;
}) {
  const tabBarHeight = useTabBarHeight();
  return (
    <View style={{ flex: 1 }} className="min-h-0">
      <FlashList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <SearchResultCard result={item} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingMore ? (
            <View className="py-4">
              {[1, 2].map((i) => (
                <PostCardSkeleton key={i} />
              ))}
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: tabBarHeight + 16 }}
      />
    </View>
  );
}
