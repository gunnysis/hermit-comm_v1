import React from 'react';
import { View, Text } from 'react-native';
import { Comment } from '../../types';
import { CommentItem } from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  onDelete?: (id: number) => void;
  currentUserId?: string;  // 현재 사용자의 UUID
}

export function CommentList({ comments, onDelete, currentUserId }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <View className="p-8 items-center">
        <Text className="text-5xl mb-3">💬</Text>
        <Text className="text-base text-gray-500">
          아직 댓글이 없습니다.
        </Text>
      </View>
    );
  }

  return (
    <View className="px-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onDelete={onDelete}
          canDelete={currentUserId === comment.author_id}
        />
      ))}
    </View>
  );
}
