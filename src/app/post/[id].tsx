import React, { useCallback, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';

import { Container } from '@/shared/components/Container';
import { ErrorView } from '@/shared/components/ErrorView';
import { Loading } from '@/shared/components/Loading';
import { PostDetailHeader } from '@/features/posts/components/PostDetailHeader';
import { PostDetailBody } from '@/features/posts/components/PostDetailBody';
import { PostDetailCommentForm } from '@/features/posts/components/PostDetailCommentForm';
import { PostDetailCommentList } from '@/features/posts/components/PostDetailCommentList';

import { usePostDetail } from '@/features/posts/hooks/usePostDetail';
import { usePostDetailAnalysis } from '@/features/posts/hooks/usePostDetailAnalysis';
import { usePostDetailComments } from '@/features/posts/hooks/usePostDetailComments';
import { usePostDetailReactions } from '@/features/posts/hooks/usePostDetailReactions';
import { useRecommendedPosts } from '@/features/posts/hooks/useRecommendedPosts';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBoards } from '@/features/boards/hooks/useBoards';
import { useBlockUser } from '@/features/blocks/hooks/useBlocks';
import { useQueryClient } from '@tanstack/react-query';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { api } from '@/shared/lib/api';
import { ANALYSIS_CONFIG } from '@/shared/lib/constants';
import { toFriendlyErrorMessage } from '@/shared/lib/errors';

const postIdNum = (id: string) => Number(id);

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const postId = postIdNum(id ?? '');
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { isWide } = useResponsiveLayout();
  const { mutate: blockUser } = useBlockUser();

  const {
    data: post,
    isLoading: postLoading,
    error: postError,
    refetch: refetchPost,
  } = usePostDetail(postId);

  const boardId = post?.board_id ?? null;

  const { data: publicBoards } = useBoards();

  const board = useMemo(() => {
    if (!boardId) return null;
    if (publicBoards) {
      return publicBoards.find((b) => b.id === boardId) ?? null;
    }
    return null;
  }, [boardId, publicBoards]);

  const anonMode = board?.anon_mode ?? 'always_anon';

  const { postAnalysis, analysisLoading } = usePostDetailAnalysis(postId);
  const { reactions, userReactedTypes, handleReaction, pendingTypes } =
    usePostDetailReactions(postId);

  const handleEmotionPress = useCallback(
    (emotion: string) => {
      router.push({ pathname: '/search', params: { emotion } });
    },
    [router],
  );

  const [isRetryingAnalysis, setIsRetryingAnalysis] = useState(false);

  const handleRetryAnalysis = useCallback(async () => {
    if (!post?.content || isRetryingAnalysis) return;
    if ((postAnalysis?.retry_count ?? 0) >= ANALYSIS_CONFIG.MAX_RETRY_COUNT) {
      Toast.show({ type: 'info', text1: '더 이상 재시도할 수 없습니다.' });
      return;
    }
    setIsRetryingAnalysis(true);
    try {
      const result = await api.invokeSmartService(postId, post.content, post.title);
      if (result.error) {
        Toast.show({
          type: 'error',
          text1: '분석에 실패했어요',
          text2: result.retryable ? '잠시 후 다시 시도해주세요' : undefined,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['postAnalysis', postId] });
    } catch {
      Toast.show({ type: 'error', text1: '분석 요청에 실패했습니다.' });
    } finally {
      setIsRetryingAnalysis(false);
    }
  }, [post, postId, postAnalysis, queryClient, isRetryingAnalysis]);
  const { data: recommendedPosts = [], isLoading: recommendedPostsLoading } =
    useRecommendedPosts(postId);
  const {
    comments,
    commentsLoading,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    handleReply,
    cancelReply,
    replyTo,
    commentContent,
    setCommentContent,
    commentLoading,
  } = usePostDetailComments({
    postId,
    post,
    anonMode,
    user,
  });

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

  const handleDeletePost = useCallback(() => {
    const isDaily = post?.post_type === 'daily';
    const title = isDaily ? '오늘의 하루 삭제' : '게시글 삭제';
    const message = isDaily
      ? '오늘의 하루를 삭제할까요?\n삭제하면 오늘 다시 나눌 수 있어요.'
      : '정말로 이 게시글을 삭제하시겠습니까?';
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deletePost(Number(id));
            if (post?.board_id) {
              queryClient.invalidateQueries({
                queryKey: ['boardPosts', post.board_id],
              });
            }
            queryClient.invalidateQueries({ queryKey: ['boardPosts'] });
            Alert.alert('완료', '게시글이 삭제되었습니다.', [
              { text: '확인', onPress: () => router.back() },
            ]);
          } catch (e) {
            Alert.alert('오류', toFriendlyErrorMessage(e, '게시글 삭제에 실패했습니다.'));
          }
        },
      },
    ]);
  }, [post, id, queryClient, router]);

  const handleBlockUser = useCallback(() => {
    if (!post || user?.id === post.author_id) return;
    Alert.alert(
      '차단',
      `${post.display_name}님을 차단할까요?\n차단하면 이 사용자의 글이 피드에서 숨겨집니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단',
          style: 'destructive',
          onPress: () => {
            blockUser(post.display_name, {
              onSuccess: () => {
                Toast.show({ type: 'success', text1: '차단되었습니다.' });
                queryClient.invalidateQueries({ queryKey: ['boardPosts'] });
                router.back();
              },
              onError: () => {
                Toast.show({ type: 'error', text1: '차단에 실패했습니다.' });
              },
            });
          },
        },
      ],
    );
  }, [post, user, blockUser, queryClient, router]);

  const onSubmitComment = useCallback(async () => {
    const result = await handleSubmitComment(() => {
      Toast.show({ type: 'success', text1: replyTo ? '답글을 남겼어요 ✓' : '댓글을 남겼어요 ✓' });
    });
    if (result?.error) {
      Alert.alert('오류', result.error);
    }
  }, [handleSubmitComment, replyTo]);

  const onDeleteComment = useCallback(
    async (commentId: number) => {
      Alert.alert('댓글 삭제', '정말로 이 댓글을 삭제하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const result = await handleDeleteComment(commentId);
            if (result?.error) {
              Alert.alert('오류', result.error);
            }
          },
        },
      ]);
    },
    [handleDeleteComment],
  );

  const onEditComment = useCallback(
    async (commentId: number, content: string) => {
      try {
        await handleEditComment(commentId, content);
      } catch (e) {
        Alert.alert('오류', e instanceof Error ? e.message : '댓글 수정에 실패했습니다.');
        throw e;
      }
    },
    [handleEditComment],
  );

  if (postLoading) {
    return (
      <Container>
        <StatusBar style="auto" />
        <Loading message="게시글을 불러오는 중..." />
      </Container>
    );
  }

  if (postError || !post) {
    return (
      <Container>
        <StatusBar style="auto" />
        <ErrorView
          message={(postError as Error)?.message ?? '게시글을 찾을 수 없습니다.'}
          onRetry={refetchPost}
        />
      </Container>
    );
  }

  const canDeletePost = user?.id === post.author_id;
  const canBlock = !!user && user.id !== post.author_id;

  return (
    <Container>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? insets.top + (isWide ? 0 : 56) : insets.top
        }>
        <PostDetailHeader
          onShare={handleShare}
          onEdit={() => {
            if (post.post_type === 'daily') {
              router.push(`/create?type=daily&edit=${id}`);
            } else {
              router.push(`/post/edit/${id}`);
            }
          }}
          onDelete={handleDeletePost}
          onBlock={canBlock ? handleBlockUser : undefined}
          canDelete={canDeletePost}
          isWide={isWide}
        />

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 12 }}>
          <PostDetailBody
            post={post}
            postAnalysis={postAnalysis}
            analysisLoading={analysisLoading}
            reactions={reactions}
            userReactedTypes={userReactedTypes}
            onReaction={handleReaction}
            pendingTypes={pendingTypes}
            recommendedPosts={recommendedPosts}
            recommendedPostsLoading={recommendedPostsLoading}
            onEmotionPress={handleEmotionPress}
            onRetryAnalysis={handleRetryAnalysis}
            isRetryingAnalysis={isRetryingAnalysis}
          />

          <PostDetailCommentList
            comments={comments}
            commentsLoading={commentsLoading}
            onDelete={onDeleteComment}
            onEdit={onEditComment}
            onReply={handleReply}
            currentUserId={user?.id}
          />
        </ScrollView>

        <PostDetailCommentForm
          value={commentContent}
          onChangeText={setCommentContent}
          onSubmit={onSubmitComment}
          loading={commentLoading}
          disabled={commentLoading || !commentContent.trim()}
          replyTo={replyTo?.displayName}
          onCancelReply={cancelReply}
        />
      </KeyboardAvoidingView>
    </Container>
  );
}
