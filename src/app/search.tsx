import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Container } from '@/shared/components/Container';
import { EmptyState } from '@/shared/components/EmptyState';
import { HighlightText } from '@/shared/components/HighlightText';
import { PostCardSkeleton } from '@/shared/components/Skeleton';
import { api } from '@/shared/lib/api';
import {
  ALLOWED_EMOTIONS,
  EMOTION_EMOJI,
  EMOTION_COLOR_MAP,
  EMPTY_STATE_MESSAGES,
  SEARCH_HIGHLIGHT,
  SEARCH_CONFIG,
} from '@/shared/lib/constants';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearAllRecentSearches,
} from '@/shared/lib/recent-searches';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { formatDate, formatReactionCount } from '@/shared/utils/format';
import { pushPost } from '@/shared/lib/navigation';
import { PostCard } from '@/features/posts/components/PostCard';
import type { SearchResult, SearchSort, Post } from '@/types';

// --- 정렬 옵션 ---

const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: 'relevance', label: '관련도순' },
  { value: 'recent', label: '최신순' },
  { value: 'popular', label: '인기순' },
];

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { placeholder } = useThemeColors();
  const params = useLocalSearchParams<{ q?: string; emotion?: string }>();
  const initialQ = params.q ?? '';
  const initialEmotion = params.emotion ?? '';
  const [query, setQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [selectedEmotion, setSelectedEmotion] = useState(initialEmotion);
  const [sort, setSort] = useState<SearchSort>('relevance');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    if (!initialQ && !initialEmotion) return;
    if (initialQ) {
      setQuery(initialQ);
      setDebouncedQuery(initialQ);
    }
    if (initialEmotion) {
      setSelectedEmotion(initialEmotion);
    }
  }, [initialQ, initialEmotion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_CONFIG.DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const trimmedQuery = debouncedQuery.trim();
  const hasTextQuery = trimmedQuery.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH;

  // --- v2 검색 (텍스트 있을 때) ---
  const {
    data: searchPages,
    isLoading: searchLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['search', trimmedQuery, selectedEmotion, sort],
    queryFn: ({ pageParam = 0 }) =>
      api.searchPosts({
        query: trimmedQuery,
        emotion: selectedEmotion || null,
        sort,
        limit: SEARCH_CONFIG.PAGE_SIZE,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === SEARCH_CONFIG.PAGE_SIZE ? allPages.flat().length : undefined,
    initialPageParam: 0,
    enabled: hasTextQuery,
    staleTime: SEARCH_CONFIG.STALE_TIME_MS,
  });

  // --- 감정 전용 (텍스트 없을 때) ---
  const { data: emotionPosts, isLoading: emotionLoading } = useQuery({
    queryKey: ['postsByEmotion', selectedEmotion],
    queryFn: () => api.getPostsByEmotion(selectedEmotion, 50, 0),
    enabled: selectedEmotion.length > 0 && !hasTextQuery,
  });

  // 검색 성공 시 최근 검색어 저장
  useEffect(() => {
    if (hasTextQuery && searchPages?.pages?.[0]?.length !== undefined) {
      addRecentSearch(trimmedQuery);
      setRecentSearches(getRecentSearches());
    }
  }, [hasTextQuery, trimmedQuery, searchPages?.pages?.[0]?.length]);

  const searchResults = useMemo(() => searchPages?.pages.flat() ?? [], [searchPages]);

  const isSearchMode = hasTextQuery;
  const isEmotionOnlyMode = selectedEmotion.length > 0 && !hasTextQuery;
  const hasActiveFilter = hasTextQuery || selectedEmotion.length > 0;
  const showInitial = !hasActiveFilter;

  const isLoading = isSearchMode ? searchLoading : isEmotionOnlyMode ? emotionLoading : false;
  const displayPosts = isSearchMode ? searchResults : isEmotionOnlyMode ? (emotionPosts ?? []) : [];

  const resultCount = hasActiveFilter && !isLoading ? displayPosts.length : null;
  const isEmpty = !isLoading && displayPosts.length === 0 && hasActiveFilter;

  // --- 핸들러 ---

  const handleRecentPress = useCallback((q: string) => {
    setQuery(q);
    setDebouncedQuery(q);
  }, []);

  const handleRemoveRecent = useCallback((q: string) => {
    setRecentSearches(removeRecentSearch(q));
  }, []);

  const handleClearAllRecent = useCallback(() => {
    clearAllRecentSearches();
    setRecentSearches([]);
  }, []);

  const handleEmotionPress = useCallback((emotion: string) => {
    setSelectedEmotion((prev) => (prev === emotion ? '' : emotion));
  }, []);

  const handleClearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // --- 렌더 ---

  return (
    <Container>
      <StatusBar style="auto" />
      <View className="flex-1">
        {/* 헤더: 뒤로 + 검색 입력 */}
        <View className="flex-row items-center gap-2 px-3 pt-3 pb-2 bg-cream-50 dark:bg-stone-900 border-b border-cream-200 dark:border-stone-700">
          <Pressable
            onPress={() => router.back()}
            className="p-2 rounded-lg active:bg-stone-200/30 dark:active:bg-stone-700/30"
            accessibilityLabel="뒤로 가기"
            accessibilityRole="button">
            <Ionicons name="chevron-back" size={22} color={isDark ? '#D6D3D1' : '#78716C'} />
          </Pressable>
          <View className="flex-1 flex-row items-center rounded-xl border border-cream-200 dark:border-stone-600 bg-white dark:bg-stone-800 px-3">
            <Ionicons name="search" size={16} color={isDark ? '#78716C' : '#A8A29E'} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="제목, 내용 검색"
              placeholderTextColor={placeholder}
              className="flex-1 py-2.5 px-2 text-sm text-gray-800 dark:text-stone-100"
              accessibilityLabel="검색어 입력"
              autoFocus={!initialEmotion}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable
                onPress={handleClearQuery}
                className="p-1 rounded-full active:bg-stone-200/50 dark:active:bg-stone-700/50"
                accessibilityLabel="검색어 지우기">
                <Ionicons name="close-circle" size={18} color={isDark ? '#78716C' : '#A8A29E'} />
              </Pressable>
            )}
          </View>
        </View>

        {/* 감정 필터 칩 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-cream-200 dark:border-stone-700"
          contentContainerClassName="px-3 py-2 gap-1.5"
          contentContainerStyle={{ alignItems: 'center' }}>
          {ALLOWED_EMOTIONS.map((emotion) => {
            const isActive = selectedEmotion === emotion;
            const emoji = EMOTION_EMOJI[emotion] ?? '';
            const colors = EMOTION_COLOR_MAP[emotion];
            const gradientBg = colors?.gradient[0];

            return (
              <Pressable
                key={emotion}
                onPress={() => handleEmotionPress(emotion)}
                style={isActive && gradientBg ? { backgroundColor: gradientBg } : undefined}
                className={`rounded-full px-3 py-1.5 active:opacity-80 ${
                  isActive
                    ? 'border border-stone-300 dark:border-stone-500'
                    : 'bg-stone-100 dark:bg-stone-800'
                }`}
                accessibilityLabel={`${emotion} 필터${isActive ? ' (선택됨)' : ''}`}
                accessibilityRole="button">
                <Text
                  className={`text-xs ${
                    isActive
                      ? 'font-semibold text-stone-800 dark:text-stone-100'
                      : 'text-stone-600 dark:text-stone-300'
                  }`}>
                  {emoji} {emotion}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 정렬 + 필터 상태 바 */}
        {hasActiveFilter && (
          <View className="px-3 py-2 bg-cream-50/50 dark:bg-stone-900/50 border-b border-cream-200/50 dark:border-stone-700/50">
            {/* 정렬 토글 (텍스트 검색 시에만) */}
            {isSearchMode && (
              <View className="flex-row gap-1.5 mb-2">
                {SORT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setSort(opt.value)}
                    className={`px-3 py-1.5 rounded-full ${
                      sort === opt.value
                        ? isDark
                          ? 'bg-happy-600'
                          : 'bg-happy-400'
                        : isDark
                          ? 'bg-stone-800'
                          : 'bg-stone-100'
                    }`}
                    accessibilityLabel={`${opt.label} 정렬`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sort === opt.value }}>
                    <Text
                      className={`text-xs font-semibold ${
                        sort === opt.value
                          ? 'text-white'
                          : isDark
                            ? 'text-stone-400'
                            : 'text-stone-500'
                      }`}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* 필터 상태 */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 flex-1">
                {selectedEmotion ? (
                  <Text className="text-xs text-gray-500 dark:text-stone-400">
                    {trimmedQuery
                      ? `'${trimmedQuery}' + ${selectedEmotion}`
                      : `${selectedEmotion} 감정의 이야기`}
                  </Text>
                ) : (
                  <Text className="text-xs text-gray-500 dark:text-stone-400">
                    {`'${trimmedQuery}' 검색`}
                  </Text>
                )}
                {resultCount !== null && (
                  <Text className="text-xs font-medium text-happy-700 dark:text-happy-400">
                    {resultCount}건
                  </Text>
                )}
              </View>
              {selectedEmotion && (
                <Pressable
                  onPress={() => setSelectedEmotion('')}
                  className="px-2 py-1 rounded-full bg-stone-200 dark:bg-stone-700 active:opacity-70"
                  accessibilityLabel="감정 필터 해제">
                  <Text className="text-xs text-stone-600 dark:text-stone-300">필터 해제</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* 초기 화면: 최근 검색어 + 감정 추천 */}
        {showInitial && (
          <ScrollView className="flex-1" contentContainerClassName="px-4 py-4">
            {recentSearches.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm font-semibold text-gray-700 dark:text-stone-200">
                    최근 검색어
                  </Text>
                  <Pressable
                    onPress={handleClearAllRecent}
                    className="active:opacity-70"
                    accessibilityLabel="최근 검색어 전체 삭제">
                    <Text className="text-xs text-stone-400 dark:text-stone-500">전체 삭제</Text>
                  </Pressable>
                </View>
                <View className="gap-1">
                  {recentSearches.map((q) => (
                    <View
                      key={q}
                      className="flex-row items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                      <Pressable
                        onPress={() => handleRecentPress(q)}
                        className="flex-1 flex-row items-center gap-2 active:opacity-70"
                        accessibilityLabel={`검색어: ${q}`}
                        accessibilityRole="button">
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={isDark ? '#78716C' : '#A8A29E'}
                        />
                        <Text className="text-sm text-stone-700 dark:text-stone-300">{q}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleRemoveRecent(q)}
                        className="p-1.5 active:opacity-70"
                        accessibilityLabel={`'${q}' 삭제`}>
                        <Ionicons name="close" size={14} color={isDark ? '#57534E' : '#D6D3D1'} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View>
              <Text className="text-sm font-semibold text-gray-700 dark:text-stone-200 mb-3">
                감정으로 찾기
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {ALLOWED_EMOTIONS.map((emotion) => {
                  const emoji = EMOTION_EMOJI[emotion] ?? '';
                  return (
                    <Pressable
                      key={emotion}
                      onPress={() => handleEmotionPress(emotion)}
                      className="rounded-xl bg-stone-50 dark:bg-stone-800 px-3 py-2 active:opacity-70 border border-stone-100 dark:border-stone-700"
                      accessibilityLabel={`${emotion} 감정 검색`}
                      accessibilityRole="button">
                      <Text className="text-sm text-stone-600 dark:text-stone-300">
                        {emoji} {emotion}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}

        {/* 빈 상태 */}
        {!showInitial && isEmpty && (
          <EmptyState
            icon="🔍"
            title={
              selectedEmotion && !hasTextQuery
                ? `'${selectedEmotion}' 감정의 글이 없어요`
                : selectedEmotion && hasTextQuery
                  ? `'${trimmedQuery}' + ${selectedEmotion} 결과가 없어요`
                  : EMPTY_STATE_MESSAGES.search.title
            }
            description={
              selectedEmotion
                ? '다른 감정이나 검색어를 시도해보세요.'
                : EMPTY_STATE_MESSAGES.search.description
            }
          />
        )}

        {/* 로딩 스켈레톤 */}
        {!showInitial && isLoading && displayPosts.length === 0 && (
          <View className="p-4">
            {[1, 2, 3].map((i) => (
              <PostCardSkeleton key={i} />
            ))}
          </View>
        )}

        {/* 검색 결과 (텍스트 검색 — 하이라이트 포함) */}
        {isSearchMode && !isLoading && searchResults.length > 0 && (
          <SearchResultList
            results={searchResults}
            onEndReached={handleEndReached}
            isFetchingMore={isFetchingNextPage}
          />
        )}

        {/* 감정 전용 결과 (기존 PostCard 사용) */}
        {isEmotionOnlyMode && !emotionLoading && (emotionPosts ?? []).length > 0 && (
          <EmotionPostList posts={emotionPosts as Post[]} />
        )}
      </View>
    </Container>
  );
}

// --- 검색 결과 카드 (하이라이트 포함) ---

const SearchResultCard = React.memo(function SearchResultCard({
  result,
}: {
  result: SearchResult;
}) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handlePress = useCallback(() => {
    pushPost(router, result.id);
  }, [router, result.id]);

  return (
    <Pressable
      onPress={handlePress}
      className="mx-4 mb-2.5 rounded-xl overflow-hidden border bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-700/60 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`검색 결과: ${result.title}`}>
      {result.emotions?.[0] && EMOTION_COLOR_MAP[result.emotions[0]] && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            backgroundColor: EMOTION_COLOR_MAP[result.emotions[0]].gradient[1],
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
            zIndex: 1,
          }}
        />
      )}
      <View className="p-4">
        <HighlightText
          text={result.title_highlight}
          className="text-[17px] font-bold text-gray-800 dark:text-stone-100 leading-6 mb-1.5"
          numberOfLines={2}
          highlightStyle={{
            backgroundColor: isDark ? SEARCH_HIGHLIGHT.dark : SEARCH_HIGHLIGHT.light,
          }}
        />

        <HighlightText
          text={result.content_highlight}
          className="text-[14px] text-gray-500 dark:text-stone-400 mb-2 leading-5"
          numberOfLines={3}
          highlightStyle={{
            backgroundColor: isDark ? SEARCH_HIGHLIGHT.dark : SEARCH_HIGHLIGHT.light,
          }}
        />

        {result.emotions && result.emotions.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mb-2">
            {result.emotions.slice(0, 2).map((emotion) => {
              const emoji = EMOTION_EMOJI[emotion] ?? '💬';
              return (
                <View
                  key={emotion}
                  className={`rounded-full px-2.5 py-0.5 ${
                    isDark ? 'bg-stone-800/80' : 'bg-stone-50'
                  }`}>
                  <Text className="text-xs text-stone-500 dark:text-stone-400">
                    {emoji} {emotion}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View className="flex-row justify-between items-center flex-wrap gap-2">
          <View className="flex-row items-center gap-1.5">
            <View
              className={`px-2.5 py-1 rounded-full ${isDark ? 'bg-happy-900/40' : 'bg-happy-50'}`}>
              <Text className="text-xs font-semibold text-happy-700 dark:text-happy-300">
                {result.display_name}
              </Text>
            </View>
            <View
              className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-stone-800/60' : 'bg-stone-50'}`}>
              <Text className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                👍 {formatReactionCount(result.like_count ?? 0)}
              </Text>
            </View>
            <View
              className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-stone-800/60' : 'bg-stone-50'}`}>
              <Text className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                💬 {result.comment_count ?? 0}
              </Text>
            </View>
          </View>
          <Text className="text-[11px] text-stone-400 dark:text-stone-500">
            {formatDate(result.created_at)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

// --- 검색 결과 FlashList ---

function SearchResultList({
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

// --- 감정 전용 결과 리스트 ---

function EmotionPostList({ posts }: { posts: Post[] }) {
  return (
    <View style={{ flex: 1 }} className="min-h-0">
      <FlashList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
      />
    </View>
  );
}
