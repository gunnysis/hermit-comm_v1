import React, { useCallback, useMemo } from 'react';
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
import { useAuthor } from '@/features/posts/hooks/useAuthor';
import { useGroupBoards } from '@/features/community/hooks/useGroupBoards';
import { useBoards } from '@/features/community/hooks/useBoards';
import { useQueryClient } from '@tanstack/react-query';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { api } from '@/shared/lib/api';
import { toFriendlyErrorMessage } from '@/shared/lib/errors';

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

  const {
    data: post,
    isLoading: postLoading,
    error: postError,
    refetch: refetchPost,
  } = usePostDetail(postId);

  const groupId = post?.group_id ?? null;
  const boardId = post?.board_id ?? null;

  const { data: groupBoards } = useGroupBoards(groupId);
  const { data: publicBoards } = useBoards();

  const board = useMemo(() => {
    if (!boardId) return null;
    if (groupId && groupBoards) {
      return groupBoards.find((b) => b.id === boardId) ?? null;
    }
    if (publicBoards) {
      return publicBoards.find((b) => b.id === boardId) ?? null;
    }
    return null;
  }, [boardId, groupId, groupBoards, publicBoards]);

  const anonMode = board?.anon_mode ?? 'always_anon';

  const { postAnalysis, analysisLoading } = usePostDetailAnalysis(postId);
  const { reactions, userReactedTypes, handleReaction, pendingTypes } =
    usePostDetailReactions(postId);
  const { data: recommendedPosts = [], isLoading: recommendedPostsLoading } =
    useRecommendedPosts(postId);
  const {
    comments,
    commentsLoading,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    commentContent,
    setCommentContent,
    commentLoading,
  } = usePostDetailComments({
    postId,
    post,
    anonMode,
    savedAuthor: savedAuthor ?? '',
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
    Alert.alert('게시글 삭제', '정말로 이 게시글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deletePost(Number(id));
            if (post?.group_id && post?.board_id) {
              queryClient.invalidateQueries({
                queryKey: ['groupPosts', post.group_id, post.board_id],
              });
              queryClient.invalidateQueries({
                queryKey: ['groupPosts', post.group_id],
              });
            }
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

  const onSubmitComment = useCallback(async () => {
    const result = await handleSubmitComment(() => {
      Toast.show({ type: 'success', text1: '댓글을 남겼어요 ✓' });
    });
    if (result?.error) {
      Alert.alert('오류', result.error);
    }
  }, [handleSubmitComment]);

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
          onEdit={() => router.push(`/post/edit/${id}`)}
          onDelete={handleDeletePost}
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
          />

          <PostDetailCommentList
            comments={comments}
            commentsLoading={commentsLoading}
            onDelete={onDeleteComment}
            onEdit={onEditComment}
            currentUserId={user?.id}
          />
        </ScrollView>

        <PostDetailCommentForm
          value={commentContent}
          onChangeText={setCommentContent}
          onSubmit={onSubmitComment}
          loading={commentLoading}
          disabled={commentLoading || !commentContent.trim()}
        />
      </KeyboardAvoidingView>
    </Container>
  );
}
