import { useColorScheme } from 'nativewind';

/**
 * 다크 모드에서 JS 레벨 색상(Ionicons color, RenderHTML style 등)에 사용할 값을 반환.
 * NativeWind className의 `dark:` 접두사가 지원되지 않는 곳에서 사용.
 */
export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    /** 주요 텍스트 색상 */
    text: isDark ? '#e7e5e4' : '#1f2937', // stone-200 / gray-800
    /** 보조 텍스트 색상 */
    textSecondary: isDark ? '#a8a29e' : '#6B7280', // stone-400 / gray-500
    /** 약한 텍스트 색상 */
    textMuted: isDark ? '#78716c' : '#9CA3AF', // stone-500 / gray-400
    /** 기본 배경 */
    background: isDark ? '#1c1917' : '#FFFEF5', // stone-900 / cream-50
    /** 카드 배경 */
    cardBackground: isDark ? '#1c1917' : '#FFFFFF', // stone-900 / white
    /** 인용/코드 배경 */
    codeBackground: isDark ? '#292524' : '#FFFCEB', // stone-800 / cream-100
    /** 링크 색상 */
    link: isDark ? '#60a5fa' : '#2563eb', // blue-400 / blue-600
    /** 테두리 색상 */
    border: isDark ? '#44403c' : '#FFF2AD', // stone-700 / cream-400
    /** 아이콘 기본 색상 */
    icon: isDark ? '#a8a29e' : '#6B7280', // stone-400 / gray-500
    /** 아이콘 파괴적 색상 */
    iconDestructive: isDark ? '#FF8F85' : '#FF7366', // coral-400 / coral-500
    /** 쉐브론 아이콘 색상 */
    chevron: isDark ? '#78716c' : '#D1D5DB', // stone-500 / gray-300
    /** placeholder 텍스트 색상 */
    placeholder: isDark ? '#78716c' : '#9CA3AF', // stone-500 / gray-400
    /** StatusBar 스타일 */
    statusBarStyle: (isDark ? 'light' : 'dark') as 'light' | 'dark',
    /** TabBar 활성 색상 */
    tabBarActive: isDark ? '#FFC300' : '#111827', // happy-500 / gray-900
    /** TabBar 비활성 색상 */
    tabBarInactive: isDark ? '#78716c' : '#9CA3AF', // stone-500 / gray-400
    /** TabBar 배경 */
    tabBarBackground: isDark ? '#0c0a09' : '#FFFFFF', // stone-950 / white
    /** TabBar 테두리 */
    tabBarBorder: isDark ? '#292524' : '#E5E7EB', // stone-800 / gray-200
    /** FAB 아이콘 색상 */
    fabIcon: isDark ? '#1c1917' : '#1F2937', // stone-900 / gray-800
  } as const;
}
