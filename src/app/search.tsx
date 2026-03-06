import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Container } from '@/shared/components/Container';
import { Input } from '@/shared/components/Input';
import { PostList } from '@/features/posts/components/PostList';
import { EmptyState } from '@/shared/components/EmptyState';
import { api } from '@/shared/lib/api';
import { draftStorage } from '@/shared/lib/storage';
import { ALLOWED_EMOTIONS, EMOTION_EMOJI } from '@/shared/lib/constants';
import { useQuery } from '@tanstack/react-query';
import type { Post } from '@/types';

const RECENT_SEARCHES_KEY = 'search_recent';
const RECENT_MAX = 5;
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

export default function SearchScreen() {
  const router = useRouter();
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
    search(debouncedQuery);
  }, [search, debouncedQuery]);

  const handleRecentPress = useCallback((q: string) => {
    setQuery(q);
    setDebouncedQuery(q);
  }, []);

  const handleEmotionPress = useCallback((emotion: string) => {
    setSelectedEmotion((prev) => (prev === emotion ? '' : emotion));
  }, []);

  const { data: emotionPosts, isLoading: emotionLoading } = useQuery({
    queryKey: ['postsByEmotion', selectedEmotion],
    queryFn: () => api.getPostsByEmotion(selectedEmotion, 50, 0),
    enabled: selectedEmotion.length > 0 && debouncedQuery.trim().length === 0,
  });

  const displayPosts = useMemo(() => {
    if (selectedEmotion && !debouncedQuery.trim()) {
      return (emotionPosts ?? []) as Post[];
    }
    return posts;
  }, [selectedEmotion, debouncedQuery, emotionPosts, posts]);

  const isLoading = selectedEmotion && !debouncedQuery.trim() ? emotionLoading : loading;

  const hasActiveFilter = debouncedQuery.trim().length > 0 || selectedEmotion.length > 0;
  const isEmpty = !isLoading && displayPosts.length === 0 && hasActiveFilter;
  const showRecent = !hasActiveFilter && recentSearches.length > 0;

  const listError = useMemo(() => (isEmpty && error ? error : null), [isEmpty, error]);

  return (
    <Container>
      <StatusBar style="auto" />
      <View className="flex-1">
        <View className="flex-row items-center gap-2 px-4 pt-4 pb-3 bg-cream-50 dark:bg-stone-900 border-b border-cream-200 dark:border-stone-700">
          <Pressable
            onPress={() => router.back()}
            className="p-2 active:opacity-70"
            accessibilityLabel="뒤로 가기"
            accessibilityRole="button">
            <Text className="text-base text-happy-700 dark:text-stone-300 font-semibold">
              ← 뒤로
            </Text>
          </Pressable>
          <View className="flex-1">
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="제목·내용 검색"
              className="mb-0"
              accessibilityLabel="검색어 입력"
              autoFocus={!initialEmotion}
            />
          </View>
        </View>

        {/* 감정 필터 칩 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-cream-200 dark:border-stone-700"
          contentContainerClassName="px-4 py-2 gap-2">
          {ALLOWED_EMOTIONS.map((emotion) => {
            const isActive = selectedEmotion === emotion;
            const emoji = EMOTION_EMOJI[emotion] ?? '💬';
            return (
              <Pressable
                key={emotion}
                onPress={() => handleEmotionPress(emotion)}
                className={`rounded-full px-3 py-1.5 active:opacity-80 ${
                  isActive ? 'bg-happy-600 dark:bg-happy-700' : 'bg-stone-100 dark:bg-stone-800'
                }`}
                accessibilityLabel={`${emotion} 필터${isActive ? ' (선택됨)' : ''}`}
                accessibilityRole="button">
                <Text
                  className={`text-sm ${
                    isActive ? 'text-white font-medium' : 'text-stone-600 dark:text-stone-300'
                  }`}>
                  {emoji} {emotion}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedEmotion && !debouncedQuery.trim() && (
          <View className="px-4 py-2 bg-cream-50 dark:bg-stone-900 border-b border-cream-200 dark:border-stone-700">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600 dark:text-stone-300">
                {`'${selectedEmotion}' 감정의 이야기들`}
              </Text>
              <Pressable
                onPress={() => setSelectedEmotion('')}
                className="px-2 py-1 rounded-full bg-stone-200 dark:bg-stone-700 active:opacity-70"
                accessibilityLabel="필터 해제">
                <Text className="text-xs text-stone-600 dark:text-stone-300">초기화</Text>
              </Pressable>
            </View>
          </View>
        )}

        {showRecent && (
          <View className="px-4 py-3 border-b border-cream-200 dark:border-stone-700">
            <Text className="text-sm text-gray-500 dark:text-stone-400 mb-2">최근 검색어</Text>
            <View className="flex-row flex-wrap gap-2">
              {recentSearches.map((q) => (
                <Pressable
                  key={q}
                  onPress={() => handleRecentPress(q)}
                  className="rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1.5 active:opacity-80"
                  accessibilityLabel={`검색어: ${q}`}
                  accessibilityRole="button">
                  <Text className="text-sm text-stone-600 dark:text-stone-300">{q}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {isEmpty ? (
          <EmptyState
            icon="🔍"
            title={
              selectedEmotion && !debouncedQuery.trim()
                ? `'${selectedEmotion}' 감정의 글이 없어요`
                : '검색 결과가 없어요.'
            }
            description={
              selectedEmotion && !debouncedQuery.trim()
                ? '다른 감정을 선택해보세요.'
                : '다른 검색어로 시도해보세요.'
            }
          />
        ) : (
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
