import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

function TabBarBackground() {
  const { isDark } = useThemeColors();
  return (
    <BlurView
      intensity={isDark ? 50 : 80}
      tint={isDark ? 'dark' : 'light'}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { tabBarActive, tabBarInactive, isDark } = useThemeColors();
  const tabBarPaddingBottom =
    Platform.OS === 'ios' ? Math.max(28, insets.bottom) : Math.max(8, insets.bottom);
  const tabBarHeight = Platform.OS === 'ios' ? 88 : 60 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabBarActive,
        tabBarInactiveTintColor: tabBarInactive,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0.5,
          borderTopColor: isDark ? 'rgba(41,37,36,0.6)' : 'rgba(229,231,235,0.6)',
          backgroundColor: 'transparent',
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
          letterSpacing: 0.2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarLabel: '홈',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={23} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: '그룹',
          tabBarLabel: '그룹',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons name={focused ? 'people' : 'people-outline'} size={23} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarLabel: '설정',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={23} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
