import { useWindowDimensions } from 'react-native';

// NativeWind/Tailwind 기본 브레이크포인트 기준
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
} as const;

// 콘텐츠 최대 너비 (폰 앱 느낌 유지)
export const CONTENT_MAX_WIDTH = 600;

export type DeviceType = 'phone' | 'tablet' | 'desktop';

interface ResponsiveLayout {
  /** 현재 화면 너비 */
  width: number;
  /** 현재 화면 높이 */
  height: number;
  /** 디바이스 유형 */
  deviceType: DeviceType;
  /** 폰 크기인지 */
  isPhone: boolean;
  /** 태블릿 이상인지 (md 브레이크포인트) */
  isWide: boolean;
  /** 데스크톱 크기인지 (lg 브레이크포인트) */
  isDesktop: boolean;
  /** 콘텐츠 영역 최대 너비 */
  contentMaxWidth: number;
  /** 게시글 목록 컬럼 수 */
  numColumns: number;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  const isDesktop = width >= BREAKPOINTS.lg;
  const isWide = width >= BREAKPOINTS.md;
  const isPhone = !isWide;

  const deviceType: DeviceType = isDesktop ? 'desktop' : isWide ? 'tablet' : 'phone';
  const numColumns = isWide ? 2 : 1;

  return {
    width,
    height,
    deviceType,
    isPhone,
    isWide,
    isDesktop,
    contentMaxWidth: CONTENT_MAX_WIDTH,
    numColumns,
  };
}
