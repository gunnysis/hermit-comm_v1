import React, { useCallback } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { HighlightText } from '@/shared/components/HighlightText';
import { EMOTION_EMOJI, EMOTION_COLOR_MAP, SEARCH_HIGHLIGHT } from '@/shared/lib/constants';
import { formatDate, formatReactionCount } from '@/shared/utils/format';
import { pushPost } from '@/shared/lib/navigation';
import type { SearchResult } from '@/types';

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

export { SearchResultCard };
