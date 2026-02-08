import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

interface LikeButtonProps {
  count: number;
  onPress: () => void;
  loading?: boolean;
}

export function LikeButton({ count, onPress, loading = false }: LikeButtonProps) {
  const [pressed, setPressed] = useState(false);

  const handlePress = () => {
    if (loading) return;
    
    setPressed(true);
    
    // 햅틱 피드백
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      className={`
        flex-row items-center px-5 py-2.5 rounded-full border-2
        ${pressed 
          ? 'bg-coral-50 border-coral-400 shadow-lg' 
          : 'bg-white border-cream-300 shadow-md'
        }
        active:scale-95
      `}
    >
      <Text className="text-2xl mr-2">
        {pressed ? '❤️' : '🤍'}
      </Text>
      <Text className={`text-base font-bold ${pressed ? 'text-coral-600' : 'text-gray-700'}`}>
        {count}
      </Text>
    </Pressable>
  );
}
