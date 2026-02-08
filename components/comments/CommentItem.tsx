import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Comment } from '../../types';
import { formatDate } from '../../utils/format';

interface CommentItemProps {
  comment: Comment;
  onDelete?: (id: number) => void;
  canDelete?: boolean;
}

export const CommentItem = React.memo(({ comment, onDelete, canDelete }: CommentItemProps) => {
  return (
    <View className="bg-cream-50 rounded-2xl p-4 mb-3 border border-cream-200">
      <View className="flex-row justify-between items-center mb-2">
        <View className="bg-mint-100 px-3 py-1 rounded-full">
          <Text className="text-sm font-semibold text-mint-700">
            {comment.author}
          </Text>
        </View>
        <Text className="text-xs text-gray-400">
          {formatDate(comment.created_at)}
        </Text>
      </View>
      
      <Text className="text-base text-gray-700 leading-6">
        {comment.content}
      </Text>
      
      {canDelete && onDelete && (
        <Pressable
          onPress={() => onDelete(comment.id)}
          className="mt-3 self-end active:opacity-70"
        >
          <Text className="text-sm text-coral-500 font-semibold">
            삭제
          </Text>
        </Pressable>
      )}
    </View>
  );
});
