import React, { useState } from 'react';
import { View, Image, Pressable, Text, ActivityIndicator } from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { uploadPostImage } from '@/shared/lib/uploadPostImage';

interface ImagePickerProps {
  imageUrl: string | null;
  onImageUrlChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ImagePicker({ imageUrl, onImageUrlChange, disabled }: ImagePickerProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    if (disabled || uploading) return;
    const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('갤러리 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePickerExpo.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadPostImage(result.assets[0].uri);
      onImageUrlChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    if (disabled || uploading) return;
    onImageUrlChange(null);
    setError(null);
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 dark:text-stone-300 mb-2">
        이미지 (선택, 1장)
      </Text>
      {imageUrl ? (
        <View className="relative rounded-2xl overflow-hidden border border-cream-200 dark:border-stone-600">
          <Image
            source={{ uri: imageUrl }}
            className="w-full aspect-video bg-stone-100 dark:bg-stone-800"
            resizeMode="cover"
            accessibilityLabel="첨부 이미지"
          />
          <Pressable
            onPress={removeImage}
            disabled={disabled || uploading}
            className="absolute top-2 right-2 bg-black/50 rounded-full p-2 active:opacity-80"
            accessibilityLabel="이미지 제거"
            accessibilityRole="button">
            <Text className="text-white text-sm">✕</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={pickImage}
          disabled={disabled || uploading}
          className="rounded-2xl border-2 border-dashed border-cream-300 dark:border-stone-600 bg-cream-50 dark:bg-stone-800 p-6 items-center justify-center active:opacity-80"
          accessibilityLabel="이미지 선택"
          accessibilityRole="button">
          {uploading ? (
            <ActivityIndicator size="small" color="#FFC300" />
          ) : (
            <Text className="text-gray-500 dark:text-stone-400 text-sm">📷 이미지 추가</Text>
          )}
        </Pressable>
      )}
      {error ? (
        <Text className="text-xs text-coral-500 dark:text-coral-400 mt-2">{error}</Text>
      ) : null}
    </View>
  );
}
