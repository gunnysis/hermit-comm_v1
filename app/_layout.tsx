import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text, ActivityIndicator } from "react-native";
import { useAuth } from "../hooks/useAuth";
import "../global.css";

export default function RootLayout() {
  const { loading, error } = useAuth();

  // 인증 초기화 중에는 로딩 표시
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream-50 p-5">
        <ActivityIndicator size="large" color="#FFC300" />
        <Text className="mt-4 text-base text-gray-600">인증 초기화 중...</Text>
      </View>
    );
  }

  // 인증 에러 발생 시 에러 화면 표시
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-cream-50 p-5">
        <Text className="text-6xl mb-4">😢</Text>
        <Text className="text-base text-coral-600 text-center mb-2">{error}</Text>
        <Text className="text-sm text-gray-500 text-center">
          네트워크 연결을 확인하고{'\n'}앱을 다시 시작해주세요.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post/[id]" />
      </Stack>
    </SafeAreaProvider>
  );
}
