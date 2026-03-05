import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { GREETING_MESSAGES } from '@/shared/lib/constants';

type TimeSlot = keyof typeof GREETING_MESSAGES;

function getTimeSlot(): TimeSlot {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export function GreetingBanner() {
  const slot = useMemo(getTimeSlot, []);
  const { greeting, message } = GREETING_MESSAGES[slot];

  return (
    <View className="mx-4 mb-3 rounded-2xl bg-cream-50 dark:bg-stone-800 px-5 py-4">
      <Text className="text-base font-semibold text-gray-800 dark:text-stone-100">{greeting}</Text>
      <Text className="text-sm text-gray-500 dark:text-stone-400 mt-0.5">{message}</Text>
    </View>
  );
}
