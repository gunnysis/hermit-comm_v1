import React from 'react';
import { View, Text } from 'react-native';
import { CommentList } from '@/features/comments/components/CommentList';
import { Loading } from '@/shared/components/Loading';
import type { Comment } from '@/types';

interface PostDetailCommentListProps {
  comments: Comment[];
  commentsLoading: boolean;
  onDelete: (id: number) => void;
  onEdit: (id: number, content: string) => Promise<void>;
  currentUserId?: string;
}

export function PostDetailCommentList({
  comments,
  commentsLoading,
  onDelete,
  onEdit,
  currentUserId,
}: PostDetailCommentListProps) {
  return (
    <View className="py-4">
      <Text className="text-lg font-bold text-gray-800 mb-4 px-4">댓글 {comments.length}개</Text>
      {commentsLoading && comments.length === 0 ? (
        <Loading size="small" />
      ) : (
        <CommentList
          comments={comments}
          onDelete={onDelete}
          onEdit={onEdit}
          currentUserId={currentUserId}
        />
      )}
    </View>
  );
}
