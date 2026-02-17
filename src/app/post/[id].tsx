import { CommentList } from '@/features/comments/components/CommentList';
import { Button } from '@/shared/components/Button';
import { Container } from '@/shared/components/Container';
import { ErrorView } from '@/shared/components/ErrorView';
import { Input } from '@/shared/components/Input';
import { Loading } from '@/shared/components/Loading';
import { ReactionBar } from '@/features/posts/components/ReactionBar';
import { useAPI } from '@/features/posts/hooks/useAPI';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthor } from '@/features/posts/hooks/useAuthor';
import { useRealtimeComments } from '@/features/comments/hooks/useRealtimeComments';
import { useRealtimeReactions } from '@/features/posts/hooks/useRealtimeReactions';
import { api } from '@/shared/lib/api';
import { Comment, Reaction } from '@/types';
import { formatDate } from '@/shared/utils/format';
import { validateCommentContent } from '@/shared/utils/validate';
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

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { author: savedAuthor } = useAuthor();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);

  // 게시글 조회
  const {
    data: post,
    loading: postLoading,
    error: postError,
    refetch: refetchPost,
  } = useAPI(() => api.getPost(Number(id)));

  // 댓글 조회
  const { loading: commentsLoading, refetch: refetchComments } = useAPI(async () => {
    const result = await api.getComments(Number(id));
    setComments(result);
    return result;
  });

  // 반응 조회
  const { refetch: refetchReactions } = useAPI(async () => {
    const result = await api.getReactions(Number(id));
    setReactions(result);
    return result;
  });

  // 실시간 댓글 업데이트 구독
  useRealtimeComments({
    postId: Number(id),
    onInsert: useCallback((newComment: Comment) => {
      setComments((prev) =>
        prev.some((c) => c.id === newComment.id) ? prev : [...prev, newComment],
      );
    }, []),
    onDelete: useCallback((commentId: number) => {
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    }, []),
  });

  // 반응 실시간 동기화
  useRealtimeReactions({
    postId: Number(id),
    onReactionsChange: refetchReactions,
  });

  // 댓글 작성
  const handleSubmitComment = async () => {
    const validation = validateCommentContent(commentContent);
    if (!validation.isValid) {
      Alert.alert('오류', validation.error);
      return;
    }

    if (!savedAuthor) {
      Alert.alert('오류', '작성자 이름을 설정해주세요.');
      return;
    }

    try {
      setCommentLoading(true);
      await api.createComment(Number(id), {
        content: commentContent.trim(),
        author: savedAuthor,
      });
      setCommentContent('');
      await refetchComments();
    } catch (error) {
      Alert.alert('오류', '댓글 작성에 실패했습니다.');
      console.error('댓글 작성 실패:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  // 댓글 수정
  const handleEditComment = async (commentId: number, content: string) => {
    try {
      await api.updateComment(commentId, { content });
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, content } : c)));
    } catch (error) {
      Alert.alert('오류', '댓글 수정에 실패했습니다.');
      console.error('댓글 수정 실패:', error);
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
          } catch (error) {
            Alert.alert('오류', '댓글 삭제에 실패했습니다.');
            console.error('댓글 삭제 실패:', error);
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
    } catch (error) {
      Alert.alert('오류', '반응 추가에 실패했습니다.');
      console.error('반응 실패:', error);
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
            Alert.alert('성공', '게시글이 삭제되었습니다.', [
              { text: '확인', onPress: () => router.back() },
            ]);
          } catch (error) {
            Alert.alert('오류', '게시글 삭제에 실패했습니다.');
            console.error('게시글 삭제 실패:', error);
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
        <ErrorView message={postError || '게시글을 찾을 수 없습니다.'} onRetry={refetchPost} />
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}>
        {/* 헤더 */}
        <View className="flex-row justify-between items-center px-4 pt-12 pb-4 bg-lavender-100 border-b border-cream-200 shadow-sm">
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
                <Text className="text-sm font-semibold text-happy-700">{post.author}</Text>
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
