import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Container } from '../../components/common/Container';
import { Loading } from '../../components/common/Loading';
import { ErrorView } from '../../components/common/ErrorView';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { CommentList } from '../../components/comments/CommentList';
import { LikeButton } from '../../components/reactions/LikeButton';
import { api } from '../../lib/api';
import { useAPI } from '../../hooks/useAPI';
import { useAuthor } from '../../hooks/useAuthor';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeComments } from '../../hooks/useRealtimeComments';
import { Comment } from '../../types';
import { formatDate } from '../../utils/format';
import { validateCommentContent } from '../../utils/validate';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { author: savedAuthor } = useAuthor();
  const { user } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [commentContent, setCommentContent] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // 게시글 조회
  const { data: post, loading: postLoading, error: postError, refetch: refetchPost } = useAPI(
    () => api.getPost(Number(id))
  );

  // 댓글 조회
  const { loading: commentsLoading, refetch: refetchComments } = useAPI(
    async () => {
      const result = await api.getComments(Number(id));
      setComments(result);
      return result;
    }
  );

  // 반응 조회
  const { refetch: refetchReactions } = useAPI(
    async () => {
      const result = await api.getReactions(Number(id));
      const likeReaction = result.find((r) => r.reaction_type === 'like');
      setLikeCount(likeReaction?.count || 0);
      return result;
    }
  );

  // 실시간 댓글 업데이트 구독
  useRealtimeComments({
    postId: Number(id),
    onInsert: useCallback((newComment: Comment) => {
      // 이미 있으면 추가하지 않음 (중복 key 방지)
      setComments((prev) =>
        prev.some((c) => c.id === newComment.id) ? prev : [...prev, newComment]
      );
    }, []),
    onDelete: useCallback((commentId: number) => {
      // 삭제된 댓글을 목록에서 제거
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    }, []),
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

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    Alert.alert(
      '댓글 삭제',
      '정말로 이 댓글을 삭제하시겠습니까?',
      [
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
      ]
    );
  };

  // 좋아요
  const handleLike = async () => {
    try {
      setLikeLoading(true);
      await api.createReaction(Number(id), { reaction_type: 'like' });
      await refetchReactions();
    } catch (error) {
      Alert.alert('오류', '좋아요 처리에 실패했습니다.');
      console.error('좋아요 실패:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  // 게시글 삭제
  const handleDeletePost = () => {
    Alert.alert(
      '게시글 삭제',
      '정말로 이 게시글을 삭제하시겠습니까?',
      [
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
      ]
    );
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
          message={postError || '게시글을 찾을 수 없습니다.'}
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 헤더 */}
        <View className="flex-row justify-between items-center px-4 pt-12 pb-4 bg-lavender-100 border-b border-cream-200 shadow-sm">
          <Pressable onPress={() => router.back()} className="p-2 active:opacity-70">
            <Text className="text-base text-happy-700 font-semibold">
              ← 뒤로
            </Text>
          </Pressable>
          {canDeletePost && (
            <Pressable onPress={handleDeletePost} className="p-2 active:opacity-70">
              <Text className="text-base text-coral-500 font-semibold">
                삭제
              </Text>
            </Pressable>
          )}
        </View>

        <ScrollView className="flex-1">
          {/* 게시글 내용 */}
          <View className="p-4 border-b border-cream-200 bg-white">
            <Text className="text-2xl font-bold text-gray-800 mb-3">
              {post.title}
            </Text>
            <View className="flex-row justify-between items-center mb-4">
              <View className="bg-happy-100 px-3 py-1.5 rounded-full">
                <Text className="text-sm font-semibold text-happy-700">
                  {post.author}
                </Text>
              </View>
              <Text className="text-xs text-gray-400">
                {formatDate(post.created_at)}
              </Text>
            </View>
            <Text className="text-base text-gray-700 leading-6 mb-6">
              {post.content}
            </Text>

            {/* 좋아요 버튼 */}
            <View className="items-start">
              <LikeButton
                count={likeCount}
                onPress={handleLike}
                loading={likeLoading}
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
                currentUserId={user?.id}
              />
            )}
          </View>
        </ScrollView>

        {/* 댓글 작성 */}
        <View className="flex-row items-end gap-2 px-4 py-3 bg-white border-t border-cream-200 shadow-lg">
          <View className="flex-1">
            <Input
              value={commentContent}
              onChangeText={setCommentContent}
              placeholder="댓글을 입력하세요 💬"
              multiline
              maxLength={1000}
              className="max-h-24 mb-0"
            />
          </View>
          <Button
            title="작성"
            onPress={handleSubmitComment}
            loading={commentLoading}
            disabled={commentLoading || !commentContent.trim()}
            size="sm"
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
