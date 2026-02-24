/**
 * Expo App Configuration
 * 환경별로 bundleIdentifier, package, appName을 자동으로 설정합니다.
 */

// ─── 버전 관리 ───────────────────────────────────────────────────────────────
//
//  ┌──────────────────────┬────────────────────────────────────────────────────┐
//  │ 배포 유형            │ 변경 대상                                           │
//  ├──────────────────────┼────────────────────────────────────────────────────┤
//  │ OTA 배포 (JS만 변경) │ 아무것도 변경하지 않음                              │
//  │                      │ → npm run update:preview | update:production        │
//  ├──────────────────────┼────────────────────────────────────────────────────┤
//  │ 네이티브 빌드        │ NATIVE_VERSION 올리기  ← OTA 호환성 경계 결정       │
//  │ (모듈·권한·플러그인  │ BUILD_NUMBER 올리기    ← 스토어 제출 카운터         │
//  │  변경, prebuild 필요)│ → eas build --platform android --profile production │
//  └──────────────────────┴────────────────────────────────────────────────────┘
//
//  NATIVE_VERSION
//    · runtimeVersion(policy: 'appVersion')의 기준값.
//    · 같은 버전으로 빌드된 앱끼리만 OTA를 수신함.
//    · 올려야 할 때: 새 네이티브 모듈 추가, Expo 플러그인/권한 변경, prebuild 필요 변경.
//    · 올리면 안 될 때: JS/TS 코드만 바뀐 버그 수정·기능 추가 → OTA로 배포.
//
//  BUILD_NUMBER
//    · 스토어 제출 카운터 (iOS buildNumber / Android versionCode).
//    · production 프로파일은 eas.json의 autoIncrement:true 로 EAS가 자동 관리.
//    · development/preview는 필요 시 수동으로 올림.
// ─────────────────────────────────────────────────────────────────────────────
const NATIVE_VERSION = '1.6.0';
const BUILD_NUMBER = 1; // production은 EAS autoIncrement 로 자동 관리

module.exports = ({ config }) => {
  // EAS Build Profile 또는 APP_ENV 환경 변수로 환경 감지
  const buildProfile = process.env.EAS_BUILD_PROFILE || process.env.APP_ENV || 'development';
  
  // 환경별 설정
  const envConfig = {
    development: {
      name: '은둔마을 (Dev)',
      bundleIdentifier: 'com.gns.hermitcomm.dev',
      package: 'com.gns.hermitcomm.dev',
      scheme: 'hermitcommdev',
    },
    preview: {
      name: '은둔마을 (Preview)',
      bundleIdentifier: 'com.gns.hermitcomm.preview',
      package: 'com.gns.hermitcomm.preview',
      scheme: 'hermitcommpreview',
    },
    production: {
      name: '은둔마을',
      bundleIdentifier: 'com.gns.hermitcomm',
      package: 'com.gns.hermitcomm',
      scheme: 'hermitcomm',
    },
  };

  // 현재 환경 설정 가져오기 (기본값: development)
  const currentEnv = envConfig[buildProfile] || envConfig.development;

  return {
    ...config,
    expo: {
      ...config.expo,
      name: currentEnv.name,
      slug: 'gns-hermit-comm',
      version: NATIVE_VERSION,
      orientation: 'portrait',
      icon: './assets/icon.png',
      scheme: currentEnv.scheme,
      userInterfaceStyle: 'light',
      // newArchEnabled: false, // Removed - use Development Build instead of Expo Go
      runtimeVersion: {
        policy: 'appVersion',
      },
      splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#FFF8E7', // 따뜻한 크림색 (행복한 느낌)
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: currentEnv.bundleIdentifier,
        buildNumber: String(BUILD_NUMBER),
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#FFF8E7', // 따뜻한 크림색 (행복한 느낌)
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: currentEnv.package,
        versionCode: BUILD_NUMBER,
        permissions: [],
        intentFilters: [
          {
            action: 'VIEW',
            data: [
              { scheme: currentEnv.scheme, pathPrefix: '/post' },
              { scheme: currentEnv.scheme, pathPrefix: '/admin' },
            ],
            category: ['BROWSABLE', 'DEFAULT'],
          },
        ],
      },
      web: {
        bundler: 'metro',
        output: 'static',
        favicon: './assets/favicon.png',
      },
      plugins: [
        'expo-router',
        [
          '@sentry/react-native',
          {
            organization: process.env.SENTRY_ORG ?? '',
            project: process.env.SENTRY_PROJECT ?? '',
          },
        ],
      ],
      experiments: {
        typedRoutes: true,
      },
      updates: {
        url: 'https://u.expo.dev/bc4199dd-30ad-42bb-ba1c-4e6fce0eecdd',
        checkAutomatically: buildProfile === 'development' ? 'ON_ERROR_RECOVERY' : 'ON_LOAD',
      },
      extra: {
        router: {},
        eas: {
          projectId: 'bc4199dd-30ad-42bb-ba1c-4e6fce0eecdd',
        },
        // 현재 환경 정보를 앱에서도 사용 가능하도록
        appEnv: buildProfile,
        // Supabase 설정
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      },
    },
  };
};
