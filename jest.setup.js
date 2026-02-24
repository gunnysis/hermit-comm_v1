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