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
  onReply?: (parentId: number) => void;
  currentUserId?: string;
}

export function PostDetailCommentList({
  comments,
  commentsLoading,
  onDelete,
  onEdit,
  onReply,
  currentUserId,
}: PostDetailCommentListProps) {
  return (
    <View className="py-3">
      <Text className="text-base font-bold text-gray-800 dark:text-stone-100 mb-3 px-3">
        댓글 {comments.length}개
      </Text>
      {commentsLoading && comments.length === 0 ? (
        <Loading size="small" />
      ) : (
        <CommentList
          comments={comments}
          onDelete={onDelete}
          onEdit={onEdit}
          onReply={onReply}
          currentUserId={currentUserId}
        />
      )}
    </View>
  );
}
