import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Container } from '@/shared/components/Container';
import { Loading } from '@/shared/components/Loading';
import { ErrorView } from '@/shared/components/ErrorView';
import { useMyGroups } from '@/features/community/hooks/useMyGroups';

export default function MyGroupsScreen() {
  const router = useRouter();
  const { data: groups, isLoading, error, refetch } = useMyGroups();

  if (isLoading) {
    return (
      <Container>
        <StatusBar style="dark" />
        <Loading message="내 그룹을 불러오는 중..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <StatusBar style="dark" />
        <ErrorView message="그룹 목록을 불러오지 못했습니다." onRetry={refetch} />
      </Container>
    );
  }

  return (
    <Container>
      <StatusBar style="dark" />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="bg-happy-100 px-4 pt-12 pb-6 border-b border-cream-200 shadow-sm">
          <Text className="text-3xl font-bold text-gray-800">내 그룹</Text>
          <Text className="text-sm text-gray-600 mt-2">
            참여 중인 프로그램/소모임의 익명 게시판 목록입니다.
          </Text>
        </View>

        <View className="p-4 gap-3">
          {(groups || []).length === 0 ? (
            <Text className="text-sm text-gray-500">아직 참여 중인 그룹이 없습니다.</Text>
          ) : (
            groups?.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => router.push(`/groups/${group.id}`)}
                className="bg-white rounded-2xl px-4 py-3 border border-cream-200 active:opacity-80">
                <Text className="text-base font-semibold text-gray-800">{group.name}</Text>
                {group.description && (
                  <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
                    {group.description}
                  </Text>
                )}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Container>
  );
}

