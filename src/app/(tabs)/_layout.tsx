import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout, CONTENT_MAX_WIDTH } from '@/shared/hooks/useResponsiveLayout';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isWide } = useResponsiveLayout();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFC300',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#FFC300',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          // 넓은 화면: 탭바를 콘텐츠 영역과 같은 너비로 중앙 정렬
          ...(isWide && {
            maxWidth: CONTENT_MAX_WIDTH,
            alignSelf: 'center' as const,
            width: '100%' as unknown as number,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: '#FFF2AD',
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: '그룹',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '작성',
          tabBarIcon: ({ color, size }) => <Ionicons name="create" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
