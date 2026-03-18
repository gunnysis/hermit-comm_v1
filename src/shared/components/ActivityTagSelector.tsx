import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ACTIVITY_PRESETS, DAILY_CONFIG } from '@/shared/lib/constants';
import { supabase } from '@/shared/lib/supabase';
import { logger } from '@/shared/utils/logger';

interface ActivityTagSelectorProps {
  selected: string[];
  onSelect: (activities: string[]) => void;
}

export function ActivityTagSelector({ selected, onSelect }: ActivityTagSelectorProps) {
  const isDark = useColorScheme() === 'dark';
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [savedCustoms, setSavedCustoms] = useState<string[]>([]);

  // 저장된 커스텀 활동 로드
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_preferences')
        .select('custom_activities')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.custom_activities?.length) {
        setSavedCustoms(data.custom_activities as string[]);
      }
    })();
  }, []);

  const toggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selected.includes(id)) {
      onSelect(selected.filter((s) => s !== id));
    } else if (selected.length < DAILY_CONFIG.MAX_ACTIVITIES) {
      onSelect([...selected, id]);
    }
  };

  const addCustom = async () => {
    const trimmed = customInput.trim().slice(0, DAILY_CONFIG.MAX_CUSTOM_ACTIVITY_LENGTH);
    if (trimmed && !selected.includes(trimmed) && selected.length < DAILY_CONFIG.MAX_ACTIVITIES) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect([...selected, trimmed]);
      setCustomInput('');
      setShowCustom(false);

      // DB에 커스텀 활동 저장 (중복 제거)
      if (!ACTIVITY_PRESETS.some((p) => p.id === trimmed) && !savedCustoms.includes(trimmed)) {
        const updated = [...savedCustoms, trimmed].slice(-10); // 최대 10개 유지
        setSavedCustoms(updated);
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { error } = await supabase
              .from('user_preferences')
              .update({ custom_activities: updated })
              .eq('user_id', user.id);
            if (error) throw error;
          }
        } catch (e) {
          logger.error('[ActivityTagSelector] 커스텀 활동 저장 실패:', e);
        }
      }
    }
  };

  const presetIds: string[] = ACTIVITY_PRESETS.map((p) => p.id);
  const customTags = savedCustoms.filter((s) => !presetIds.includes(s));

  return (
    <View>
      <Text className={`text-sm mb-2 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
        오늘 한 것 있나요?{' '}
        <Text className={isDark ? 'text-stone-500' : 'text-stone-400'}>없어도 괜찮아요</Text>
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {ACTIVITY_PRESETS.map((preset) => {
          const isActive = selected.includes(preset.id);
          return (
            <Pressable
              key={preset.id}
              onPress={() => toggle(preset.id)}
              className={`rounded-full px-2.5 py-1 border ${
                isActive
                  ? isDark
                    ? 'border-stone-400 bg-stone-700'
                    : 'border-stone-400 bg-stone-100'
                  : isDark
                    ? 'border-stone-600'
                    : 'border-stone-300'
              }`}
              accessibilityLabel={`${preset.name} ${isActive ? '선택됨' : '선택'}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isActive }}>
              <Text className={`text-xs ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                {preset.icon}
                {isActive ? ` ${preset.name}` : ''}
              </Text>
            </Pressable>
          );
        })}

        {/* 저장된 커스텀 활동 */}
        {customTags.map((custom) => {
          const isActive = selected.includes(custom);
          return (
            <Pressable
              key={custom}
              onPress={() => toggle(custom)}
              className={`rounded-full px-2.5 py-1 border ${
                isActive
                  ? isDark
                    ? 'border-lavender-400 bg-lavender-900/30'
                    : 'border-lavender-400 bg-lavender-50'
                  : isDark
                    ? 'border-stone-600'
                    : 'border-stone-300'
              }`}
              accessibilityLabel={`${custom} ${isActive ? '선택됨' : '선택'}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isActive }}>
              <Text className={`text-xs ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                {isActive ? `✦ ${custom}` : custom}
              </Text>
            </Pressable>
          );
        })}

        {/* Custom input toggle */}
        {!showCustom ? (
          <Pressable
            onPress={() => setShowCustom(true)}
            className={`rounded-full px-2.5 py-1 border ${isDark ? 'border-stone-600' : 'border-stone-300'}`}>
            <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              + 직접입력
            </Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center gap-1">
            <TextInput
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={addCustom}
              maxLength={DAILY_CONFIG.MAX_CUSTOM_ACTIVITY_LENGTH}
              placeholder="활동 입력"
              placeholderTextColor={isDark ? '#78716c' : '#a8a29e'}
              className={`rounded-full px-3 py-1 text-xs border ${
                isDark
                  ? 'border-stone-600 text-stone-200 bg-stone-800'
                  : 'border-stone-300 text-stone-700 bg-white'
              }`}
              style={{ minWidth: 80 }}
              autoFocus
            />
          </View>
        )}
      </View>
      {/* Show selected custom tags not in presets or saved */}
      {selected
        .filter((s: string) => !presetIds.includes(s) && !savedCustoms.includes(s))
        .map((custom) => (
          <Pressable key={custom} onPress={() => toggle(custom)} className="mt-1">
            <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              ✕ {custom}
            </Text>
          </Pressable>
        ))}
    </View>
  );
}
