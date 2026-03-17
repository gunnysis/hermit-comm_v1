import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { useEmotionTimeline } from '../hooks/useEmotionTimeline';
import { processEmotionTimeline } from '@/shared/lib/utils.generated';
import { EMOTION_COLOR_MAP, EMOTION_EMOJI } from '@/shared/lib/constants';

interface EmotionWaveNativeProps {
  days?: number;
}

export function EmotionWaveNative({ days = 7 }: EmotionWaveNativeProps) {
  const isDark = useColorScheme() === 'dark';
  const { data: timeline = [] } = useEmotionTimeline(days);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { bars, topEmotions, maxTotal, topEmotion } = useMemo(
    () => processEmotionTimeline(timeline),
    [timeline],
  );

  // Empty state
  if (!bars.length) {
    return (
      <View className="mb-4">
        <Text
          className={`text-sm font-semibold mb-2 ${isDark ? 'text-stone-100' : 'text-gray-800'}`}>
          마을의 감정 흐름
        </Text>
        <View className="relative" style={{ height: 128 }}>
          <View className="flex-row items-end gap-1" style={{ height: '100%' }}>
            {[20, 30, 15, 25, 20, 30, 18].map((h, i) => (
              <View key={i} className="flex-1 justify-end" style={{ height: '100%' }}>
                <View
                  className="rounded-t-sm"
                  style={{
                    height: `${h}%`,
                    backgroundColor: isDark ? '#292524' : '#e7e5e4',
                    opacity: 0.5,
                  }}
                />
                <Text
                  className="text-center mt-0.5"
                  style={{ fontSize: 9, color: isDark ? '#57534e' : '#d6d3d1' }}>
                  {['월', '화', '수', '목', '금', '토', '일'][i]}
                </Text>
              </View>
            ))}
          </View>
          <View
            className="absolute items-center justify-center"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
            <View
              className="rounded-full px-3 py-1.5"
              style={{ backgroundColor: isDark ? '#1c1917ee' : '#ffffffee' }}>
              <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                아직 이 주의 이야기가 모이고 있어요
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-1">
        <Text className={`text-sm font-semibold ${isDark ? 'text-stone-100' : 'text-gray-800'}`}>
          마을의 감정 흐름
        </Text>
        <Text style={{ fontSize: 10 }} className={isDark ? 'text-stone-500' : 'text-stone-400'}>
          최근 {days}일
        </Text>
      </View>

      {/* Insight */}
      {topEmotion && (
        <Text className={`text-xs mb-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          이번 주 가장 많이 나눈 감정은 {EMOTION_EMOJI[topEmotion]}{' '}
          <Text className={`font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
            {topEmotion}
          </Text>
          이에요
        </Text>
      )}

      {/* Chart */}
      <View className="flex-row items-end gap-1.5" style={{ height: 128 }}>
        {bars.map((bar, i) => (
          <Pressable
            key={bar.day}
            className="flex-1 justify-end"
            style={{ height: '100%' }}
            onPress={() => setSelectedIndex(selectedIndex === i ? null : i)}>
            {/* Bar */}
            <View
              className="rounded-t-sm overflow-hidden"
              style={{
                height: `${(bar.total / maxTotal) * 100}%`,
                minHeight: bar.total > 0 ? 4 : 0,
                opacity: selectedIndex !== null && selectedIndex !== i ? 0.35 : 1,
              }}>
              {bar.segments.map((seg, si) => {
                const colors = EMOTION_COLOR_MAP[seg.emotion];
                return (
                  <View
                    key={seg.emotion}
                    style={{
                      flex: seg.count,
                      backgroundColor: colors?.gradient[1] ?? '#E7D7FF',
                      borderTopWidth: si > 0 ? 1 : 0,
                      borderTopColor: 'rgba(255,255,255,0.5)',
                    }}
                  />
                );
              })}
            </View>

            {/* Day label */}
            <Text
              className={`text-center mt-0.5 ${
                bar.isToday
                  ? isDark
                    ? 'text-stone-100 font-semibold'
                    : 'text-stone-900 font-semibold'
                  : isDark
                    ? 'text-stone-500'
                    : 'text-stone-400'
              }`}
              style={{ fontSize: 9 }}>
              {bar.weekday}
            </Text>
            {bar.isToday && (
              <View
                className="self-center mt-0.5 rounded-full"
                style={{
                  width: 3,
                  height: 3,
                  backgroundColor: isDark ? '#e7e5e4' : '#1c1917',
                }}
              />
            )}
          </Pressable>
        ))}
      </View>

      {/* Selected day tooltip */}
      {selectedIndex !== null && bars[selectedIndex] && bars[selectedIndex].total > 0 && (
        <View
          className={`mt-2 rounded-xl px-3 py-2 ${isDark ? 'bg-stone-800' : 'bg-stone-50'}`}
          style={{ borderWidth: 1, borderColor: isDark ? '#44403c' : '#e7e5e4' }}>
          <Text
            className={`font-medium mb-1 ${isDark ? 'text-stone-200' : 'text-stone-700'}`}
            style={{ fontSize: 11 }}>
            {new Date(bars[selectedIndex].day + 'T00:00:00').toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
              weekday: 'short',
            })}
          </Text>
          {bars[selectedIndex].segments.map((seg) => (
            <View key={seg.emotion} className="flex-row items-center justify-between mt-0.5">
              <View className="flex-row items-center gap-1">
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    backgroundColor: EMOTION_COLOR_MAP[seg.emotion]?.gradient[1] ?? '#E7D7FF',
                  }}
                />
                <Text
                  style={{ fontSize: 11 }}
                  className={isDark ? 'text-stone-300' : 'text-stone-600'}>
                  {EMOTION_EMOJI[seg.emotion]} {seg.emotion}
                </Text>
              </View>
              <Text
                style={{ fontSize: 11 }}
                className={isDark ? 'text-stone-400' : 'text-stone-500'}>
                {seg.pct}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Legend */}
      <View className="flex-row flex-wrap gap-x-3 gap-y-1 mt-2">
        {topEmotions.map((emotion) => {
          const colors = EMOTION_COLOR_MAP[emotion];
          return (
            <View key={emotion} className="flex-row items-center gap-1">
              <View
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 2,
                  backgroundColor: colors?.gradient[1] ?? '#E7D7FF',
                }}
              />
              <Text
                className={isDark ? 'text-stone-400' : 'text-stone-500'}
                style={{ fontSize: 10 }}>
                {EMOTION_EMOJI[emotion]} {emotion}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
