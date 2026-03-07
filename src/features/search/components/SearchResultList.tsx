import React from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { PostCardSkeleton } from '@/shared/components/Skeleton';
import { SearchResultCard } from './SearchResultCard';
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
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
      />
    </View>
  );
}
