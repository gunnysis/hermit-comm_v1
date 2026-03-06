import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/shared/components/Container';
import { PostList } from '@/features/posts/components/PostList';
import { EmptyState } from '@/shared/components/EmptyState';
import { api } from '@/shared/lib/api';
import { draftStorage } from '@/shared/lib/storage';
import { ALLOWED_EMOTIONS, EMOTION_EMOJI, EMOTION_COLOR_MAP } from '@/shared/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import type { Post } from '@/types';

const RECENT_SEARCHES_KEY = 'search_recent';
const RECENT_MAX = 8;
const DEBOUNCE_MS = 300;

function getRecentSearches(): string[] {
  try {
    const raw = draftStorage.getString(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string): void {
  if (!query.trim()) return;
  const recent = getRecentSearches().filter((q) => q !== query);
  recent.unshift(query.trim());
  draftStorage.set(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, RECENT_MAX)));
}

function removeRecentSearch(query: string): string[] {
  const recent = getRecentSearches().filter((q) => q !== query);
  draftStorage.set(RECENT_SEARCHES_KEY, JSON.stringify(recent));
  return recent;
}

function clearAllRecentSearches(): void {
  draftStorage.remove(RECENT_SEARCHES_KEY);
}

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setPosts([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.searchPosts(trimmed, 50, 0);
      setPosts(result as Post[]);
      addRecentSearch(trimmed);
      setRecentSearches(getRecentSearches());
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색에 실패했습니다.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  const handleRefresh = useCallback(() => {
    if (selectedEmotion && !debouncedQuery.trim()) return;
    search(debouncedQuery);
  }, [search, debouncedQuery, selectedEmotion]);

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

  // 감정 필터: 텍스트 검색이 없을 때만 RPC로 감정별 조회
  const { data: emotionPosts, isLoading: emotionLoading } = useQuery({
    queryKey: ['postsByEmotion', selectedEmotion],
    queryFn: () => api.getPostsByEmotion(selectedEmotion, 50, 0),
    enabled: selectedEmotion.length > 0 && debouncedQuery.trim().length === 0,
  });

  // 텍스트 검색 + 감정 필터 동시: 텍스트 검색 결과에서 감정 필터링
  const displayPosts = useMemo(() => {
    if (selectedEmotion && !debouncedQuery.trim()) {
      return (emotionPosts ?? []) as Post[];
    }
    if (selectedEmotion && debouncedQuery.trim()) {
      return posts.filter((p) => p.emotions && p.emotions.includes(selectedEmotion));
    }
    return posts;
  }, [selectedEmotion, debouncedQuery, emotionPosts, posts]);

  const isLoading = selectedEmotion && !debouncedQuery.trim() ? emotionLoading : loading;

  const hasActiveFilter = debouncedQuery.trim().length > 0 || selectedEmotion.length > 0;
  const isEmpty = !isLoading && displayPosts.length === 0 && hasActiveFilter;
  const showInitial = !hasActiveFilter;

  const resultCount = hasActiveFilter && !isLoading ? displayPosts.length : null;
  const listError = useMemo(() => (isEmpty && error ? error : null), [isEmpty, error]);

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
          contentContainerClassName="px-3 py-2 gap-1.5">
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

        {/* 필터 상태 바 */}
        {hasActiveFilter && (
          <View className="flex-row items-center justify-between px-4 py-2 bg-cream-50/50 dark:bg-stone-900/50">
            <View className="flex-row items-center gap-2 flex-1">
              {selectedEmotion ? (
                <Text className="text-xs text-gray-500 dark:text-stone-400">
                  {debouncedQuery.trim()
                    ? `'${debouncedQuery}' + ${selectedEmotion}`
                    : `${selectedEmotion} 감정의 이야기`}
                </Text>
              ) : (
                <Text className="text-xs text-gray-500 dark:text-stone-400">
                  {`'${debouncedQuery}' 검색`}
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

        {/* 검색 결과 */}
        {!showInitial && isEmpty && (
          <EmptyState
            icon="🔍"
            title={
              selectedEmotion && !debouncedQuery.trim()
                ? `'${selectedEmotion}' 감정의 글이 없어요`
                : selectedEmotion && debouncedQuery.trim()
                  ? `'${debouncedQuery}' + ${selectedEmotion} 결과가 없어요`
                  : '검색 결과가 없어요.'
            }
            description={
              selectedEmotion
                ? '다른 감정이나 검색어를 시도해보세요.'
                : '다른 검색어로 시도해보세요.'
            }
          />
        )}

        {!showInitial && !isEmpty && (
          <PostList
            posts={displayPosts}
            loading={isLoading}
            error={listError}
            onRefresh={handleRefresh}
            hasMore={false}
          />
        )}
      </View>
    </Container>
  );
}
