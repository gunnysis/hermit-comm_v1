import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, Pressable, Animated, useColorScheme, Modal, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PostDetailHeaderProps {
  onShare: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canDelete: boolean;
  /** 넓은 화면일 때 상단 패딩 축소 */
  isWide?: boolean;
}

/** 아이콘 버튼 공통 컴포넌트 */
function IconButton({
  icon,
  label,
  hint,
  onPress,
  color,
  size = 22,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint?: string;
  onPress: () => void;
  color?: string;
  size?: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [onPress, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        className="w-10 h-10 items-center justify-center rounded-full active:bg-stone-200/40 dark:active:bg-stone-600/40"
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityRole="button">
        <Ionicons name={icon} size={size} color={color} />
      </Pressable>
    </Animated.View>
  );
}

/** 더보기 메뉴 드롭다운 */
function MoreMenu({
  visible,
  onClose,
  onEdit,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Pressable className="flex-1" onPress={onClose}>
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
          className={`absolute top-24 right-4 rounded-2xl overflow-hidden border ${
            isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'
          }`}>
          <View
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.4 : 0.15,
              shadowRadius: 16,
              elevation: 8,
            }}>
            {onEdit && (
              <Pressable
                onPress={() => {
                  onClose();
                  onEdit();
                }}
                className={`flex-row items-center px-5 py-3.5 ${
                  isDark ? 'active:bg-stone-700' : 'active:bg-stone-50'
                }`}
                accessibilityLabel="게시글 수정"
                accessibilityRole="menuitem">
                <Ionicons name="pencil-outline" size={18} color={isDark ? '#D6D3D1' : '#57534E'} />
                <Text
                  className={`ml-3 text-[15px] font-medium ${
                    isDark ? 'text-stone-200' : 'text-stone-700'
                  }`}>
                  수정
                </Text>
              </Pressable>
            )}
            {onEdit && onDelete && (
              <View className={`h-px ${isDark ? 'bg-stone-700' : 'bg-stone-100'}`} />
            )}
            {onDelete && (
              <Pressable
                onPress={() => {
                  onClose();
                  onDelete();
                }}
                className={`flex-row items-center px-5 py-3.5 ${
                  isDark ? 'active:bg-stone-700' : 'active:bg-stone-50'
                }`}
                accessibilityLabel="게시글 삭제"
                accessibilityRole="menuitem">
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text className="ml-3 text-[15px] font-medium text-red-500">삭제</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export function PostDetailHeader({
  onShare,
  onEdit,
  onDelete,
  canDelete,
  isWide,
}: PostDetailHeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [menuVisible, setMenuVisible] = useState(false);

  const iconColor = isDark ? '#E7E5E4' : '#44403C';
  const hasMenu = canDelete && (onEdit || onDelete);

  return (
    <>
      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? 'dark' : 'light'}
        className={`flex-row justify-between items-center px-3 pb-3 border-b ${
          isDark ? 'border-stone-800/60' : 'border-stone-200/60'
        } ${isWide ? 'pt-3' : 'pt-12'}`}>
        {/* 왼쪽: 뒤로 가기 */}
        <IconButton
          icon="chevron-back"
          label="뒤로 가기"
          hint="이전 화면으로 돌아갑니다"
          onPress={() => router.back()}
          color={iconColor}
          size={24}
        />

        {/* 오른쪽: 공유 + 더보기 */}
        <View className="flex-row items-center gap-1">
          <IconButton
            icon="share-outline"
            label="공유"
            hint="이 게시글 링크를 공유합니다"
            onPress={onShare}
            color={iconColor}
          />
          {hasMenu && (
            <IconButton
              icon="ellipsis-horizontal"
              label="더보기"
              hint="수정, 삭제 메뉴를 엽니다"
              onPress={() => setMenuVisible(true)}
              color={iconColor}
            />
          )}
        </View>
      </BlurView>

      {/* 더보기 드롭다운 메뉴 */}
      <MoreMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onEdit={canDelete ? onEdit : undefined}
        onDelete={canDelete ? onDelete : undefined}
      />
    </>
  );
}
