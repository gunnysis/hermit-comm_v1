import { useJoinGroupByInviteCode } from '@/features/community/hooks/useJoinGroupByInviteCode';
import { useMyGroups } from '@/features/community/hooks/useMyGroups';
import { leaveGroup } from '@/features/community/api/communityApi';
import { Button } from '@/shared/components/Button';
import { Container } from '@/shared/components/Container';
import { ErrorView } from '@/shared/components/ErrorView';
import { Input } from '@/shared/components/Input';
import { Loading } from '@/shared/components/Loading';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { toFriendlyErrorMessage } from '@/shared/lib/errors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

export default function MyGroupsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
        Alert.alert('완료', '그룹에 참여했어요. 내 그룹 목록에서 확인할 수 있어요.', [
          { text: '확인' },
        ]);
      }
    } catch (e) {
      const message = toFriendlyErrorMessage(
        e,
        '그룹에 참여하지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
      Alert.alert('안내', message);
    }
  }, [inviteCode, joinMutation]);

  const handleLeaveGroup = useCallback(
    (groupId: number, groupName: string) => {
      Alert.alert(
        '그룹 나가기',
        `"${groupName}" 그룹에서 나가시겠습니까?\n나가면 해당 그룹의 게시글을 볼 수 없게 됩니다.`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '나가기',
            style: 'destructive',
            onPress: async () => {
              try {
                await leaveGroup(groupId);
                queryClient.invalidateQueries({ queryKey: ['myGroups'] });
                Alert.alert('완료', '그룹에서 나갔습니다.');
              } catch (e) {
                const message = toFriendlyErrorMessage(
                  e,
                  '그룹에서 나가지 못했습니다. 잠시 후 다시 시도해주세요.',
                );
                Alert.alert('오류', message);
              }
            },
          },
        ],
      );
    },
    [queryClient],
  );

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

  const validGroups = groups ?? [];

  return (
    <Container>
      <StatusBar style="dark" />
      <View className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 16 }}>
          <ScreenHeader title="내 그룹" subtitle="참여 중인 프로그램/소모임의 익명 게시판" />

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

          <View className="p-4 gap-3">
            <Text className="text-sm font-semibold text-gray-800 mb-1">
              내 그룹 목록 ({validGroups.length})
            </Text>
            {validGroups.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text className="text-sm text-gray-500 mt-3 text-center">
                  아직 참여 중인 그룹이 없습니다.{'\n'}초대 코드를 입력하여 그룹에 참여해보세요.
                </Text>
              </View>
            ) : (
              validGroups.map((group) => (
                <View
                  key={group.id}
                  className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
                  <Pressable
                    onPress={() =>
                      router.push(`/groups/${group.id}` as Parameters<typeof router.push>[0])
                    }
                    className="px-4 py-4 active:opacity-80">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-800">{group.name}</Text>
                        {group.description && (
                          <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
                            {group.description}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                  </Pressable>
                  <View className="border-t border-cream-100 px-4 py-2">
                    <Pressable
                      onPress={() => handleLeaveGroup(group.id, group.name)}
                      className="flex-row items-center gap-1 py-1 active:opacity-70"
                      accessibilityLabel={`${group.name} 그룹에서 나가기`}
                      accessibilityRole="button">
                      <Ionicons name="log-out-outline" size={14} color="#EF4444" />
                      <Text className="text-xs text-red-500">나가기</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </Container>
  );
}
