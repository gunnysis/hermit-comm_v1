import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Container } from '@/shared/components/Container';
import { Loading } from '@/shared/components/Loading';
import { ErrorView } from '@/shared/components/ErrorView';
import { useMyGroups } from '@/features/community/hooks/useMyGroups';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { useJoinGroupByInviteCode } from '@/features/community/hooks/useJoinGroupByInviteCode';
import { toFriendlyErrorMessage } from '@/shared/lib/errors';

export default function MyGroupsScreen() {
  const router = useRouter();
  const { data: groups, isLoading, error, refetch } = useMyGroups();
  const [inviteCode, setInviteCode] = useState('');
  const joinMutation = useJoinGroupByInviteCode();

  const handleJoin = useCallback(async () => {
    const trimmed = inviteCode.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert('안내', '코드를 입력해주세요.');
      return;
    }

    try {
      const result = await joinMutation.mutateAsync(trimmed);
      setInviteCode('');
      if (result.alreadyMember) {
        Alert.alert('안내', '이미 참여 중인 그룹이에요.');
      } else {
        Alert.alert('완료', '그룹에 참여했어요. 내 그룹 목록에서 확인할 수 있어요.');
      }
    } catch (e) {
      const message = toFriendlyErrorMessage(
        e,
        '그룹에 참여하지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
      Alert.alert('안내', message);
    }
  }, [inviteCode, joinMutation]);

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
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-gray-800">내 그룹</Text>
              <Text className="text-sm text-gray-600 mt-2">
                참여 중인 프로그램/소모임의 익명 게시판과 초대 코드를 한 곳에서 볼 수 있습니다.
              </Text>
            </View>
          </View>
        </View>

        {/* 초대 코드 입력 섹션 */}
        <View className="p-4 pb-1">
          <View className="bg-white rounded-2xl px-4 py-3 border border-cream-200">
            <Text className="text-sm font-semibold text-gray-800 mb-2">초대 코드로 참여</Text>
            <Text className="text-xs text-gray-500 mb-3">
              운영자로부터 받은 초대 코드를 입력하면 해당 그룹 게시판에 참여할 수 있어요.
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Input
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase())}
                  placeholder="초대 코드 입력"
                  autoCapitalize="characters"
                  maxLength={50}
                  accessibilityLabel="그룹 초대 코드"
                  accessibilityHint="운영자로부터 받은 초대 코드를 입력합니다"
                />
              </View>
              <Button
                title="참여하기"
                size="sm"
                onPress={handleJoin}
                loading={joinMutation.isPending}
                disabled={joinMutation.isPending}
                accessibilityLabel="초대 코드로 그룹 참여"
              />
            </View>
          </View>
        </View>

        {/* 내 그룹 목록 */}
        <View className="p-4 gap-3">
          <Text className="text-sm font-semibold text-gray-800 mb-1">내 그룹 목록</Text>
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
