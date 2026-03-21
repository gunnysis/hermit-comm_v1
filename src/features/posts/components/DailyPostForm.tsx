import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, useColorScheme, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  ALLOWED_EMOTIONS,
  EMOTION_EMOJI,
  EMOTION_COLOR_MAP,
  DAILY_CONFIG,
  SHARED_PALETTE,
} from '@/shared/lib/constants';
import { ActivityTagSelector } from '@/shared/components/composed/ActivityTagSelector';
import { useCreateDaily, useUpdateDaily } from '@/features/my/hooks/useCreateDaily';
import { useQueryClient } from '@tanstack/react-query';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DailyPostFormProps {
  mode?: 'create' | 'edit';
  initialData?: { id: number; emotions: string[]; activities: string[]; content: string };
}

export function DailyPostForm({ mode = 'create', initialData }: DailyPostFormProps) {
  const isDark = useColorScheme() === 'dark';
  const [emotions, setEmotions] = useState<string[]>(initialData?.emotions ?? []);
  const [activities, setActivities] = useState<string[]>(initialData?.activities ?? []);
  const [note, setNote] = useState(initialData?.content ?? '');
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();
  const { mutate: createDaily, isPending } = useCreateDaily();
  const { mutate: updateDaily, isPending: isUpdating } = useUpdateDaily();
  const submitScale = useSharedValue(1);

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

  const isBusy = isPending || isUpdating;

  const handleSubmit = () => {
    if (emotions.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('감정을 선택해주세요', '오늘의 기분을 하나 이상 골라주세요.');
      return;
    }
    // 제출 버튼 바운스
    submitScale.value = withSequence(
      withSpring(0.95, { damping: 12, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 150 }),
    );

    const callbacks = {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowSuccess(true);
        const summary = queryClient.getQueryData<{ post_count?: number }>(['activitySummary']);
        const isFirst = mode === 'create' && (!summary || (summary.post_count ?? 0) <= 1);
        setTimeout(() => {
          if (isFirst) {
            Toast.show({ type: 'success', text1: '🌱 첫 하루를 나눴어요' });
          } else {
            Toast.show({
              type: 'success',
              text1: mode === 'edit' ? '수정했어요' : '오늘의 하루를 나눴어요',
            });
          }
          router.back();
        }, 400);
      },
      onError: (err: unknown) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const code = (err as { code?: string })?.code;
        if (code === 'P0002') {
          Alert.alert('오늘은 이미 나눴어요', '하루에 한 번만 나눌 수 있어요.');
        } else {
          Alert.alert('오류', '잠시 후 다시 시도해주세요.');
        }
      },
    };
    if (mode === 'edit' && initialData) {
      updateDaily({ postId: initialData.id, emotions, activities, content: note }, callbacks);
    } else {
      createDaily({ emotions, activities, content: note }, callbacks);
    }
  };

  const submitAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  if (showSuccess) {
    return (
      <Animated.View entering={FadeIn.duration(300)} className="flex-1 items-center justify-center">
        <Animated.Text entering={FadeIn.delay(100).duration(400)} className={`text-4xl mb-4`}>
          ✨
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(200).duration(400)}
          className={`text-lg font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
          기록 완료!
        </Animated.Text>
      </Animated.View>
    );
  }

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerStyle={{ paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled">
      <Text
        className={`text-lg font-bold mt-4 mb-6 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
        오늘의 하루
      </Text>

      {/* 감정 선택 */}
      <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
        오늘 기분이 어때요?
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {ALLOWED_EMOTIONS.map((emotion, index) => {
          const isActive = emotions.includes(emotion);
          const colors = EMOTION_COLOR_MAP[emotion];
          return (
            <Animated.View
              key={emotion}
              entering={FadeIn.delay(index * 30).duration(250)}
              layout={Layout.springify()}>
              <Pressable
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
            </Animated.View>
          );
        })}
      </View>

      {/* 활동 태그 */}
      <View className="mb-6">
        <ActivityTagSelector selected={activities} onSelect={setActivities} />
      </View>

      {/* 한마디 */}
      <Text className={`text-sm mb-2 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
        한마디 남기기 <Text className={isDark ? 'text-stone-500' : 'text-stone-400'}>(선택)</Text>
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        maxLength={DAILY_CONFIG.MAX_NOTE_LENGTH}
        placeholder="오늘 하루는..."
        placeholderTextColor={isDark ? '#78716c' : '#a8a29e'}
        className={`rounded-xl px-4 py-3 text-sm mb-2 ${
          isDark
            ? 'bg-stone-800 text-stone-100 border-stone-700'
            : 'bg-stone-50 text-stone-900 border-stone-200'
        } border`}
      />
      <Text className={`text-right text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
        {note.length}/{DAILY_CONFIG.MAX_NOTE_LENGTH}
      </Text>

      {/* 나누기 버튼 */}
      <AnimatedPressable
        onPress={handleSubmit}
        disabled={isBusy || emotions.length === 0}
        className="rounded-xl py-3.5 mt-6 items-center"
        style={[
          submitAnimStyle,
          {
            backgroundColor:
              emotions.length > 0 ? SHARED_PALETTE.happy[500] : isDark ? '#292524' : '#e7e5e4',
            opacity: isBusy ? 0.6 : 1,
          },
        ]}
        accessibilityLabel={mode === 'edit' ? '오늘의 하루 수정하기' : '오늘의 하루 나누기'}
        accessibilityRole="button">
        <Text
          className="font-semibold"
          style={{
            color: emotions.length > 0 ? '#1c1917' : isDark ? '#78716c' : '#a8a29e',
          }}>
          {isBusy
            ? mode === 'edit'
              ? '수정하는 중...'
              : '나누는 중...'
            : mode === 'edit'
              ? '수정하기'
              : '나누기'}
        </Text>
      </AnimatedPressable>
    </ScrollView>
  );
}
