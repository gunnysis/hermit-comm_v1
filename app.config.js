/**
 * Expo App Configuration
 * 환경별로 bundleIdentifier, package, appName을 자동으로 설정합니다.
 */
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
      version: '1.0.0',
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
        buildNumber: '1',
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#FFF8E7', // 따뜻한 크림색 (행복한 느낌)
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: currentEnv.package,
        // versionCode는 eas.json에서 appVersionSource: "remote"를 사용하므로 제거됨
        permissions: [],
      },
      web: {
        bundler: 'metro',
        output: 'static',
        favicon: './assets/favicon.png',
      },
      plugins: [
        'expo-router',
      ],
      experiments: {
        typedRoutes: true,
      },
      // EAS Updates 설정 (development는 제외 - development client 사용)
      ...(buildProfile !== 'development' && {
        updates: {
          url: 'https://u.expo.dev/bc4199dd-30ad-42bb-ba1c-4e6fce0eecdd',
        },
      }),
      extra: {
        router: {},
        eas: {
          projectId: 'bc4199dd-30ad-42bb-ba1c-4e6fce0eecdd',
        },
        // 현재 환경 정보를 앱에서도 사용 가능하도록
        appEnv: buildProfile,
        // Supabase 설정
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ygyfxdpxkpubidwaenzq.supabase.co',
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gTb4t7VlouKir9O4MlZKKA_J9JL50nj',
      },
    },
  };
};
