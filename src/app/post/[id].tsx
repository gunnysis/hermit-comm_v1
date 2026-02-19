import { CommentList } from '@/features/comments/components/CommentList';
import { Button } from '@/shared/components/Button';
import { Container } from '@/shared/components/Container';
import { ErrorView } from '@/shared/components/ErrorView';
import { Input } from '@/shared/components/Input';
import { Loading } from '@/shared/components/Loading';
import { ReactionBar } from '@/features/posts/components/ReactionBar';
import { usePostDetail } from '@/features/posts/hooks/usePostDetail';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthor } from '@/features/posts/hooks/useAuthor';
import { useRealtimeComments } from '@/features/comments/hooks/useRealtimeComments';
import { useRealtimeReactions } from '@/features/posts/hooks/useRealtimeReactions';
import { api } from '@/shared/lib/api';
import { Comment } from '@/types';
import { formatDate } from '@/shared/utils/format';
import { validateCommentContent } from '@/shared/utils/validate';
import { resolveDisplayName } from '@/shared/lib/anonymous';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const postIdNum = (id: string) => Number(id);

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const postId = postIdNum(id ?? '');
  const { author: savedAuthor } = useAuthor();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { isWide } = useResponsiveLayout();

  const [commentContent, setCommentContent] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);

  // 게시글 조회
  const {
    data: post,
    isLoading: postLoading,
    error: postError,
    refetch: refetchPost,
  } = usePostDetail(postId);

  // 댓글 조회
  const {
    data: comments = [],
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => api.getComments(postId),
    enabled: postId > 0,
  });

  // 반응 조회
  const { data: reactions = [], refetch: refetchReactions } = useQuery({
    queryKey: ['reactions', postId],
    queryFn: () => api.getReactions(postId),
    enabled: postId > 0,
  });

  // 실시간 댓글 업데이트 구독 (캐시 갱신)
  useRealtimeComments({
    postId,
    onInsert: useCallback(
      (newComment: Comment) => {
        queryClient.setQueryData<Comment[]>(['comments', postId], (old) =>
          old?.some((c) => c.id === newComment.id) ? old : [...(old ?? []), newComment],
        );
      },
      [queryClient, postId],
    ),
    onDelete: useCallback(
      (commentId: number) => {
        queryClient.setQueryData<Comment[]>(
          ['comments', postId],
          (old) => old?.filter((c) => c.id !== commentId) ?? [],
        );
      },
      [queryClient, postId],
    ),
  });

  // 반응 실시간 동기화
  useRealtimeReactions({
    postId,
    onReactionsChange: refetchReactions,
  });

  // 댓글 작성
  const handleSubmitComment = async () => {
    const validation = validateCommentContent(commentContent);
    if (!validation.isValid) {
      Alert.alert('오류', validation.error);
      return;
    }

    try {
      setCommentLoading(true);
      const anonMode = 'always_anon';
      const rawAuthor = savedAuthor ?? '';

      const { isAnonymous, displayName } = resolveDisplayName({
        anonMode,
        rawAuthorName: rawAuthor,
        userId: user?.id ?? null,
        boardId: post?.board_id ?? null,
        groupId: post?.group_id ?? null,
        wantNameOverride: false,
      });
      await api.createComment(Number(id), {
        content: commentContent.trim(),
        author: rawAuthor || '익명',
        board_id: post?.board_id,
        group_id: post?.group_id,
        is_anonymous: isAnonymous,
        display_name: displayName,
      });
      setCommentContent('');
      await refetchComments();
    } catch {
      Alert.alert('오류', '댓글 작성에 실패했습니다.');
    } finally {
      setCommentLoading(false);
    }
  };

  // 댓글 수정
  const handleEditComment = async (commentId: number, content: string) => {
    try {
      await api.updateComment(commentId, { content });
      queryClient.setQueryData<Comment[]>(
        ['comments', postId],
        (old) => old?.map((c) => (c.id === commentId ? { ...c, content } : c)) ?? [],
      );
    } catch (error) {
      Alert.alert('오류', '댓글 수정에 실패했습니다.');
      throw error;
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    Alert.alert('댓글 삭제', '정말로 이 댓글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteComment(commentId);
            await refetchComments();
          } catch {
            Alert.alert('오류', '댓글 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  // 반응 추가
  const handleReaction = async (reactionType: string) => {
    try {
      setReactionLoading(true);
      await api.createReaction(Number(id), { reaction_type: reactionType });
      await refetchReactions();
    } catch {
      Alert.alert('오류', '반응 추가에 실패했습니다.');
    } finally {
      setReactionLoading(false);
    }
  };

  // 공유 (딥링크 URL)
  const handleShare = useCallback(async () => {
    if (!post) return;
    const url = Linking.createURL(`/post/${id}`);
    try {
      await Share.share({
        url,
        title: post.title,
        message: `${post.title}\n${url}`,
      });
    } catch {
      // 사용자가 공유 취소 시 무시
    }
  }, [post, id]);

  // 게시글 삭제
  const handleDeletePost = () => {
    Alert.alert('게시글 삭제', '정말로 이 게시글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deletePost(Number(id));
            if (post?.group_id) {
              queryClient.invalidateQueries({ queryKey: ['groupPosts', post.group_id] });
            }
            queryClient.invalidateQueries({ queryKey: ['boardPosts'] });
            Alert.alert('성공', '게시글이 삭제되었습니다.', [
              { text: '확인', onPress: () => router.back() },
            ]);
          } catch {
            Alert.alert('오류', '게시글 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  if (postLoading) {
    return (
      <Container>
        <StatusBar style="dark" />
        <Loading message="게시글을 불러오는 중..." />
      </Container>
    );
  }

  if (postError || !post) {
    return (
      <Container>
        <StatusBar style="dark" />
        <ErrorView
          message={(postError as Error)?.message ?? '게시글을 찾을 수 없습니다.'}
          onRetry={refetchPost}
        />
      </Container>
    );
  }

  // 작성자 본인만 삭제 가능 (author_id 기반)
  const canDeletePost = user?.id === post.author_id;

  return (
    <Container>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + (isWide ? 0 : 56) : 0}>
        {/* 헤더 */}
        <View
          className={`flex-row justify-between items-center px-4 ${isWide ? 'pt-4' : 'pt-12'} pb-4 bg-lavender-100 border-b border-cream-200 shadow-sm`}>
          <Pressable
            onPress={() => router.back()}
            className="p-2 active:opacity-70"
            accessibilityLabel="뒤로 가기"
            accessibilityHint="이전 화면으로 돌아갑니다"
            accessibilityRole="button">
            <Text className="text-base text-happy-700 font-semibold">← 뒤로</Text>
          </Pressable>
          <View className="flex-row gap-2 items-center">
            <Pressable
              onPress={handleShare}
              className="p-2 active:opacity-70"
              accessibilityLabel="공유"
              accessibilityHint="이 게시글 링크를 공유합니다"
              accessibilityRole="button">
              <Text className="text-base text-happy-700 font-semibold">공유</Text>
            </Pressable>
            {canDeletePost && (
              <>
                <Pressable
                  onPress={() => router.push(`/post/edit/${id}`)}
                  className="p-2 active:opacity-70"
                  accessibilityLabel="게시글 수정"
                  accessibilityHint="이 게시글을 수정합니다"
                  accessibilityRole="button">
                  <Text className="text-base text-happy-700 font-semibold">수정</Text>
                </Pressable>
                <Pressable
                  onPress={handleDeletePost}
                  className="p-2 active:opacity-70"
                  accessibilityLabel="게시글 삭제"
                  accessibilityHint="이 게시글을 삭제합니다"
                  accessibilityRole="button">
                  <Text className="text-base text-coral-500 font-semibold">삭제</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 12 }}>
          {/* 게시글 내용 */}
          <View className="p-4 border-b border-cream-200 bg-white">
            <Text className="text-2xl font-bold text-gray-800 mb-3">{post.title}</Text>
            <View className="flex-row justify-between items-center mb-4">
              <View className="bg-happy-100 px-3 py-1.5 rounded-full">
                <Text className="text-sm font-semibold text-happy-700">
                  {post.display_name ?? post.author}
                </Text>
              </View>
              <Text className="text-xs text-gray-400">{formatDate(post.created_at)}</Text>
            </View>
            <Text className="text-base text-gray-700 leading-6 mb-6">{post.content}</Text>

            {/* 반응 (좋아요/하트/웃음) */}
            <View className="items-start">
              <ReactionBar
                reactions={reactions}
                onReaction={handleReaction}
                loading={reactionLoading}
              />
            </View>
          </View>

          {/* 댓글 목록 */}
          <View className="py-4">
            <Text className="text-lg font-bold text-gray-800 mb-4 px-4">
              💬 댓글 {comments.length}개
            </Text>
            {commentsLoading && comments.length === 0 ? (
              <Loading size="small" />
            ) : (
              <CommentList
                comments={comments}
                onDelete={handleDeleteComment}
                onEdit={handleEditComment}
                currentUserId={user?.id}
              />
            )}
          </View>
        </ScrollView>

        {/* 댓글 작성 - 하단 고정 입력 바 (키보드와 겹치지 않도록 KeyboardAvoidingView 안에 배치) */}
        <View className="flex-row items-end gap-2 px-4 py-3 bg-white border-t border-cream-200 shadow-lg">
          <View className="flex-1">
            <Input
              value={commentContent}
              onChangeText={setCommentContent}
              placeholder="댓글을 입력하세요 💬"
              multiline
              maxLength={1000}
              className="max-h-24 mb-0"
              accessibilityLabel="댓글 입력"
              accessibilityHint="댓글을 입력한 뒤 작성 버튼을 누르세요"
            />
          </View>
          <Button
            title="작성"
            onPress={handleSubmitComment}
            loading={commentLoading}
            disabled={commentLoading || !commentContent.trim()}
            size="sm"
            accessibilityLabel="댓글 작성"
            accessibilityHint="입력한 댓글을 등록합니다"
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
