import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, useColorScheme } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ALLOWED_EMOTIONS,
  EMOTION_EMOJI,
  EMOTION_COLOR_MAP,
  DAILY_CONFIG,
  SHARED_PALETTE,
} from '@/shared/lib/constants';
import { ActivityTagSelector } from '@/shared/components/composed/ActivityTagSelector';
import { useTabBarHeight } from '@/shared/hooks/useTabBarHeight';
import { useCreateDaily } from '@/features/my/hooks/useCreateDaily';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

interface DailyBottomSheetProps {
  onDismiss?: () => void;
}

export const DailyBottomSheet = forwardRef<BottomSheet, DailyBottomSheetProps>(
  function DailyBottomSheet({ onDismiss }, ref) {
    const isDark = useColorScheme() === 'dark';
    const tabBarHeight = useTabBarHeight();
    const snapPoints = useMemo(() => ['45%', '75%', '92%'], []);
    const [emotions, setEmotions] = useState<string[]>([]);
    const [activities, setActivities] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const [currentIndex, setCurrentIndex] = useState(-1);
    const queryClient = useQueryClient();
    const { mutate: createDaily, isPending } = useCreateDaily();

    const resetState = useCallback(() => {
      setEmotions([]);
      setActivities([]);
      setNote('');
    }, []);

    const toggleEmotion = useCallback(
      (emotion: string) => {
        Haptics.selectionAsync();
        if (emotions.includes(emotion)) {
          setEmotions(emotions.filter((e) => e !== emotion));
        } else if (emotions.length < DAILY_CONFIG.MAX_EMOTIONS) {
          setEmotions([...emotions, emotion]);
        }
      },
      [emotions],
    );

    const handleSubmit = useCallback(() => {
      if (emotions.length === 0 || isPending) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      createDaily(
        { emotions, activities, content: note },
        {
          onSuccess: () => {
            Toast.show({ type: 'success', text1: '오늘의 하루를 나눴어요' });
            resetState();
            (ref as React.RefObject<BottomSheet>)?.current?.close();
          },
          onError: (err: unknown) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const code = (err as { code?: string })?.code;
            if (code === 'P0002') {
              Toast.show({ type: 'error', text1: '오늘은 이미 나눴어요' });
            } else {
              Toast.show({ type: 'error', text1: '잠시 후 다시 시도해주세요' });
            }
          },
        },
      );
    }, [emotions, activities, note, isPending, createDaily, resetState, ref]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
      ),
      [],
    );

    const bgColor = isDark ? '#1c1917' : '#fff';

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        bottomInset={tabBarHeight}
        detached={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        onChange={(index) => {
          setCurrentIndex(index);
          if (index === -1) resetState();
        }}
        onClose={onDismiss}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#57534e' : '#a8a29e' }}
        backgroundStyle={{ backgroundColor: bgColor, borderRadius: 24 }}>
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {/* 헤더 */}
          <Text
            className={`text-lg font-bold mb-4 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            오늘의 하루
          </Text>

          {/* Step 1: 감정 (항상 보임) */}
          <Text
            className={`text-sm font-medium mb-2 ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
            오늘 기분이 어때요?
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {ALLOWED_EMOTIONS.map((emotion) => {
              const isActive = emotions.includes(emotion);
              const colors = EMOTION_COLOR_MAP[emotion];
              return (
                <Pressable
                  key={emotion}
                  onPress={() => toggleEmotion(emotion)}
                  style={isActive ? { backgroundColor: colors?.gradient[0] } : undefined}
                  className={`rounded-full px-3 py-1.5 ${
                    isActive ? '' : isDark ? 'bg-stone-800' : 'bg-stone-100'
                  }`}
                  accessibilityLabel={`감정 선택: ${emotion}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isActive }}>
                  <Text
                    className={`text-xs ${isActive ? 'font-semibold' : ''}`}
                    style={
                      isActive
                        ? { color: isDark ? '#fff' : '#1c1917' }
                        : { color: isDark ? '#a8a29e' : '#57534e' }
                    }>
                    {EMOTION_EMOJI[emotion]} {emotion}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Step 2: 활동 (75%+에서 보임) */}
          {currentIndex >= 1 && (
            <Animated.View entering={FadeIn.duration(200)} className="mb-4">
              <ActivityTagSelector selected={activities} onSelect={setActivities} />
            </Animated.View>
          )}

          {/* Step 3: 한마디 + 제출 (92%에서 보임) */}
          {currentIndex >= 2 && (
            <Animated.View entering={FadeIn.duration(200)}>
              <Text className={`text-sm mb-2 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                한마디 <Text className={isDark ? 'text-stone-500' : 'text-stone-400'}>(선택)</Text>
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                maxLength={DAILY_CONFIG.MAX_NOTE_LENGTH}
                placeholder="오늘 하루는..."
                placeholderTextColor={isDark ? '#78716c' : '#a8a29e'}
                returnKeyType="done"
                blurOnSubmit
                className={`rounded-xl px-4 py-3 text-sm mb-4 ${
                  isDark
                    ? 'bg-stone-800 text-stone-100 border-stone-700'
                    : 'bg-stone-50 text-stone-900 border-stone-200'
                } border`}
              />
            </Animated.View>
          )}

          {/* 나누기 버튼 (감정 1개 이상 선택 시) */}
          {emotions.length > 0 && (
            <Animated.View entering={FadeIn.duration(200)}>
              <Pressable
                onPress={handleSubmit}
                disabled={isPending}
                className="rounded-xl py-3.5 items-center"
                style={{
                  backgroundColor: SHARED_PALETTE.happy[500],
                  opacity: isPending ? 0.6 : 1,
                }}>
                <Text className="font-semibold" style={{ color: '#1c1917' }}>
                  {isPending ? '나누는 중...' : '나누기'}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);
