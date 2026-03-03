import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Animated, useColorScheme, LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';

export type SortOrder = 'latest' | 'popular';

interface SortTabsProps {
  value: SortOrder;
  onChange: (order: SortOrder) => void;
}

export function SortTabs({ value, onChange }: SortTabsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const translateX = useRef(new Animated.Value(0)).current;
  const containerWidth = useRef(0);

  useEffect(() => {
    const target = value === 'latest' ? 0 : containerWidth.current / 2;
    Animated.spring(translateX, {
      toValue: target,
      friction: 7,
      tension: 180,
      useNativeDriver: true,
    }).start();
  }, [value, translateX]);

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      containerWidth.current = e.nativeEvent.layout.width;
      if (value === 'popular') {
        translateX.setValue(containerWidth.current / 2);
      }
    },
    [value, translateX],
  );

  const handleChange = useCallback(
    (order: SortOrder) => {
      if (order !== value) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(order);
      }
    },
    [value, onChange],
  );

  return (
    <View
      onLayout={onLayout}
      className={`flex-row mt-3 rounded-xl p-1 ${isDark ? 'bg-stone-800/80' : 'bg-stone-100'}`}>
      {/* 슬라이딩 인디케이터 */}
      <Animated.View
        style={{
          transform: [{ translateX }],
          width: '50%',
          position: 'absolute',
          top: 4,
          left: 4,
          bottom: 4,
          shadowColor: isDark ? '#FFC300' : '#997500',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.15,
          shadowRadius: 4,
          elevation: 3,
        }}
        className={`rounded-lg ${isDark ? 'bg-happy-600' : 'bg-happy-400'}`}
      />
      <Pressable
        onPress={() => handleChange('latest')}
        className="flex-1 py-2.5 rounded-lg z-10"
        accessibilityLabel="최신순 정렬"
        accessibilityRole="button"
        accessibilityState={{ selected: value === 'latest' }}>
        <Text
          className={`text-center text-[13px] font-bold ${
            value === 'latest' ? 'text-white' : isDark ? 'text-stone-400' : 'text-stone-500'
          }`}>
          최신순
        </Text>
      </Pressable>
      <Pressable
        onPress={() => handleChange('popular')}
        className="flex-1 py-2.5 rounded-lg z-10"
        accessibilityLabel="인기순 정렬"
        accessibilityRole="button"
        accessibilityState={{ selected: value === 'popular' }}>
        <Text
          className={`text-center text-[13px] font-bold ${
            value === 'popular' ? 'text-white' : isDark ? 'text-stone-400' : 'text-stone-500'
          }`}>
          인기순
        </Text>
      </Pressable>
    </View>
  );
}
