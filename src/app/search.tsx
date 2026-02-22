import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Container } from '@/shared/components/Container';
import { Input } from '@/shared/components/Input';
import { PostList } from '@/features/posts/components/PostList';
import { EmptyState } from '@/shared/components/EmptyState';
import { api } from '@/shared/lib/api';
import { draftStorage } from '@/shared/lib/storage';
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
  const params = useLocalSearchParams<{ q?: string }>();
  const initialQ = params.q ?? '';
  const [query, setQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    if (!initialQ) return;
    setQuery(initialQ);
    setDebouncedQuery(initialQ);
  }, [initialQ]);

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
      setPosts(result);
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

  const isEmpty = !loading && posts.length === 0 && debouncedQuery.trim().length > 0;
  const showRecent = !debouncedQuery.trim() && recentSearches.length > 0;

  const listError = useMemo(() => (isEmpty && error ? error : null), [isEmpty, error]);

  return (
    <Container>
      <StatusBar style="dark" />
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
              autoFocus
            />
          </View>
        </View>

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
            title="검색 결과가 없어요."
            description="다른 검색어로 시도해보세요."
          />
        ) : (
          <PostList
            posts={posts}
            loading={loading}
            error={listError}
            onRefresh={handleRefresh}
            hasMore={false}
          />
        )}
      </View>
    </Container>
  );
}
