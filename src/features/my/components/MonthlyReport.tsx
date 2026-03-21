import React, { useState } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { EMOTION_EMOJI, ACTIVITY_PRESETS } from '@/shared/lib/constants';
import { getActivityLabel, getCurrentKST } from '@/shared/lib/utils.generated';
import { useMonthlyReport } from '../hooks/useMonthlyReport';
import { Skeleton } from '@/shared/components/primitives/Skeleton';

const MONTH_NAMES = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
];

interface MonthlyReportProps {
  enabled?: boolean;
}

export function MonthlyReport({ enabled = true }: MonthlyReportProps) {
  const isDark = useColorScheme() === 'dark';
  const current = getCurrentKST();
  const [year, setYear] = useState(current.year);
  const [month, setMonth] = useState(current.month);
  const { data, isLoading } = useMonthlyReport(year, month, enabled);

  const goToPrev = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNext = () => {
    if (year === current.year && month === current.month) return;
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const isCurrentMonth = year === current.year && month === current.month;

  if (isLoading) {
    return (
      <View
        className={`mt-4 rounded-2xl p-4 ${isDark ? 'bg-stone-800/50' : 'bg-cream-50'}`}
        style={{ borderWidth: 1, borderColor: isDark ? 'rgba(68,64,60,0.4)' : '#E8DCC8' }}>
        <Skeleton className="w-32 h-5 mb-3" />
        <Skeleton className="w-full h-16 rounded-xl" />
      </View>
    );
  }

  return (
    <View
      className={`mt-4 rounded-2xl p-4 ${isDark ? 'bg-stone-800/50' : 'bg-cream-50'}`}
      style={{ borderWidth: 1, borderColor: isDark ? 'rgba(68,64,60,0.4)' : '#E8DCC8' }}>
      {/* 헤더 + 네비게이션 */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className={`text-sm font-semibold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
          📊 {year}년 {MONTH_NAMES[month - 1]} 회고
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={goToPrev}
            className="px-3 py-2"
            hitSlop={8}
            accessibilityLabel="이전 달"
            accessibilityRole="button">
            <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>◀</Text>
          </Pressable>
          {!isCurrentMonth && (
            <Pressable
              onPress={goToNext}
              className="px-3 py-2"
              hitSlop={8}
              accessibilityLabel="다음 달"
              accessibilityRole="button">
              <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>▶</Text>
            </Pressable>
          )}
        </View>
      </View>

      {!data || data.days_logged === 0 ? (
        <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          이 달에는 기록이 없어요
        </Text>
      ) : (
        <>
          {/* 기록일 */}
          <Text className={`text-xs mb-3 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {data.days_in_month}일 중 {data.days_logged}일 기록
            {data.total_reactions > 0 ? ` · ❤️ ${data.total_reactions}` : ''}
            {data.total_comments > 0 ? ` · 💬 ${data.total_comments}` : ''}
          </Text>

          {/* Top 감정 */}
          {data.top_emotions.length > 0 && (
            <View className="mb-2">
              <Text className={`text-xs mb-1.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                많이 느낀 감정
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {data.top_emotions.map((item) => (
                  <View
                    key={item.emotion}
                    className={`rounded-full px-2.5 py-1 ${isDark ? 'bg-stone-700' : 'bg-stone-100'}`}>
                    <Text className={`text-xs ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                      {EMOTION_EMOJI[item.emotion] ?? '💭'} {item.emotion}
                      <Text className={isDark ? 'text-stone-500' : 'text-stone-400'}>
                        {' '}
                        {item.count}회
                      </Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Top 활동 */}
          {data.top_activities.length > 0 && (
            <View>
              <Text className={`text-xs mb-1.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                많이 한 활동
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {data.top_activities.map((item) => (
                  <View
                    key={item.activity}
                    className={`rounded-full px-2.5 py-1 ${isDark ? 'bg-stone-700' : 'bg-stone-100'}`}>
                    <Text className={`text-xs ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                      {getActivityLabel(item.activity, ACTIVITY_PRESETS)}
                      <Text className={isDark ? 'text-stone-500' : 'text-stone-400'}>
                        {' '}
                        {item.count}회
                      </Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}
