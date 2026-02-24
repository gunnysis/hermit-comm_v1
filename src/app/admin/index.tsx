import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Container } from '@/shared/components/Container';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { Loading } from '@/shared/components/Loading';
import { ErrorView } from '@/shared/components/ErrorView';
import {
  createGroupWithBoard,
  getMyManagedGroups,
  type CreateGroupWithBoardInput,
} from '@/features/admin/api/adminApi';
import { QUERY_KEY_MANAGED_GROUPS, useDeleteGroup } from '@/features/admin/hooks/useDeleteGroup';
import { auth } from '@/features/auth/auth';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toFriendlyErrorMessage } from '@/shared/lib/errors';

function useMyManagedGroups() {
  return useQuery({
    queryKey: QUERY_KEY_MANAGED_GROUPS,
    queryFn: getMyManagedGroups,
  });
}

async function shareInviteCode(inviteCode: string) {
  try {
    await Share.share({
      message: `은둔마을 그룹 초대 코드: ${inviteCode}`,
      title: '그룹 초대 코드',
    });
  } catch (e) {
    if ((e as { message?: string })?.message !== 'User did not share') {
      Alert.alert('안내', `초대 코드: ${inviteCode}\n위 코드를 복사해 사용자에게 전달해주세요.`);
    }
  }
}

export default function AdminIndexScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [description, setDescription] = useState('');

  const { data: groups, isLoading, error, refetch } = useMyManagedGroups();
  const deleteGroupMutation = useDeleteGroup();
  const createMutation = useMutation({
    mutationFn: (input: CreateGroupWithBoardInput) => createGroupWithBoard(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_MANAGED_GROUPS });
      setName('');
      setInviteCode('');
      setDescription('');
      Alert.alert(
        '그룹 생성 완료',
        `초대 코드: ${result.inviteCode}\n\n참여자에게 위 코드를 전달해주세요.`,
        [{ text: '확인' }, { text: '공유하기', onPress: () => shareInviteCode(result.inviteCode) }],
      );
    },
    onError: (err: Error) => {
      const message = toFriendlyErrorMessage(
        err,
        '그룹 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
      );
      Alert.alert('생성 실패', message);
    },
  });

  const handleSubmit = useCallback(() => {
    const trimmedName = name.trim();
    const trimmedCode = inviteCode.trim();
    if (!trimmedName) {
      Alert.alert('입력 오류', '그룹명을 입력해주세요.');
      return;
    }
    if (!trimmedCode) {
      Alert.alert('입력 오류', '초대 코드를 입력해주세요.');
      return;
    }
    createMutation.mutate({
      name: trimmedName,
      inviteCode: trimmedCode,
      description: description.trim() || undefined,
    });
  }, [name, inviteCode, description, createMutation]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleDeleteGroup = useCallback(
    (group: { id: number; name: string }) => {
      Alert.alert(
        '그룹 삭제',
        `"${group.name}"을(를) 삭제할까요? 보드와 게시글·댓글이 모두 삭제됩니다.`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => {
              deleteGroupMutation.mutate(group.id, {
                onError: (err: Error) => {
                  const message = toFriendlyErrorMessage(
                    err,
                    '삭제에 실패했습니다. 다시 시도해주세요.',
                  );
                  Alert.alert('삭제 실패', message);
                },
              });
            },
          },
        ],
      );
    },
    [deleteGroupMutation],
  );

  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      await auth.signInAnonymously();
      router.replace('/(tabs)');
    } catch (e) {
      const message = toFriendlyErrorMessage(e, '로그아웃에 실패했습니다. 다시 시도해주세요.');
      Alert.alert('로그아웃 실패', message);
    }
  }, [router]);

  if (isLoading) {
    return (
      <Container>
        <StatusBar style="auto" />
        <Loading message="관리 그룹 목록을 불러오는 중..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <StatusBar style="auto" />
        <ErrorView message="관리 그룹 목록을 불러오지 못했습니다." onRetry={refetch} />
      </Container>
    );
  }

  return (
    <Container>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled">
          {/* 헤더 */}
          <View className="bg-happy-100 dark:bg-stone-900 px-4 pt-12 pb-6 border-b border-cream-200 dark:border-stone-700 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Pressable onPress={handleBack} className="py-2 pr-2" accessibilityLabel="뒤로 가기">
                <Text className="text-base text-gray-600 dark:text-stone-400">← 뒤로</Text>
              </Pressable>
              <Pressable onPress={handleLogout} className="py-2 pl-2" accessibilityLabel="로그아웃">
                <Text className="text-base text-gray-600 dark:text-stone-400">로그아웃</Text>
              </Pressable>
            </View>
            <Text className="text-2xl font-bold text-gray-800 dark:text-stone-100 mt-2">
              관리자
            </Text>
            <Text className="text-sm text-gray-600 dark:text-stone-400 mt-1">
              그룹 게시판을 생성하고 초대 코드를 관리합니다.
            </Text>
          </View>

          {/* 그룹 생성 폼 */}
          <View className="p-4 border-b border-cream-200 dark:border-stone-700">
            <Text className="text-lg font-semibold text-gray-800 dark:text-stone-100 mb-3">
              그룹 게시판 생성
            </Text>
            <Input
              label="그룹명"
              value={name}
              onChangeText={setName}
              placeholder="예: 2025 봄 프로그램"
              maxLength={100}
            />
            <Input
              label="초대 코드"
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="예: WELCOME2025"
              maxLength={50}
              autoCapitalize="characters"
            />
            <Input
              label="설명 (선택)"
              value={description}
              onChangeText={setDescription}
              placeholder="그룹에 대한 간단한 설명"
              maxLength={500}
              multiline
            />
            <View className="mt-2">
              <Button
                title="그룹 생성"
                onPress={handleSubmit}
                loading={createMutation.isPending}
                disabled={createMutation.isPending}
              />
            </View>
          </View>

          {/* 내가 만든 그룹 목록 */}
          <View className="p-4">
            <Text className="text-lg font-semibold text-gray-800 dark:text-stone-100 mb-3">
              내가 만든 그룹
            </Text>
            {(groups ?? []).length === 0 ? (
              <Text className="text-sm text-gray-500 dark:text-stone-400">
                아직 생성한 그룹이 없습니다.
              </Text>
            ) : (
              (groups ?? []).map((group) => {
                const isDeleting =
                  deleteGroupMutation.isPending && deleteGroupMutation.variables === group.id;
                return (
                  <View
                    key={group.id}
                    className="bg-white dark:bg-stone-900 rounded-2xl px-4 py-3 mb-3 border border-cream-200 dark:border-stone-700">
                    <Text className="text-base font-semibold text-gray-800 dark:text-stone-100">
                      {group.name}
                    </Text>
                    {group.description && (
                      <Text
                        className="text-xs text-gray-500 dark:text-stone-400 mt-1"
                        numberOfLines={2}>
                        {group.description}
                      </Text>
                    )}
                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="text-xs text-gray-500 dark:text-stone-400">
                        초대 코드: {group.invite_code ?? '-'} ·{' '}
                        {format(new Date(group.created_at), 'yyyy.MM.dd', { locale: ko })}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        {group.invite_code ? (
                          <Pressable
                            onPress={() => shareInviteCode(group.invite_code!)}
                            className="px-3 py-1.5 bg-happy-200 dark:bg-happy-800 rounded-lg"
                            accessibilityLabel="초대 코드 공유"
                            disabled={isDeleting}>
                            <Text className="text-xs font-semibold text-gray-700 dark:text-happy-200">
                              공유
                            </Text>
                          </Pressable>
                        ) : null}
                        <Pressable
                          onPress={() => handleDeleteGroup(group)}
                          className="px-3 py-1.5 bg-coral-100 dark:bg-coral-900/30 rounded-lg"
                          accessibilityLabel="그룹 삭제"
                          disabled={isDeleting}>
                          <Text className="text-xs font-semibold text-coral-600 dark:text-coral-400">
                            {isDeleting ? '삭제 중…' : '삭제'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}
