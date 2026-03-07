// Jest setup - extend matchers if needed
// @testing-library/react-native v12+ includes jest-native matchers when you import from '@testing-library/react-native'

// Polyfill structuredClone for Jest
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock NativeWind
jest.mock('nativewind', () => ({
  useColorScheme: () => ({ colorScheme: 'light', setColorScheme: jest.fn(), toggleColorScheme: jest.fn() }),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: (props) => React.createElement(View, props),
      createAnimatedComponent: (comp) => comp,
    },
    useSharedValue: (init) => ({ value: init }),
    useAnimatedStyle: () => ({}),
    withSequence: (...args) => args[args.length - 1],
    withTiming: (val) => val,
    runOnJS: (fn) => fn,
  };
});

// Mock expo-blur
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: (props) => React.createElement(View, props),
  };
});

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      },
    },
  },
  __esModule: true,
}));

// Mock global.__ExpoImportMetaRegistry
if (!global.__ExpoImportMetaRegistry) {
  global.__ExpoImportMetaRegistry = {
    get: () => ({ url: '' }),
    register: () => {},
  };
}