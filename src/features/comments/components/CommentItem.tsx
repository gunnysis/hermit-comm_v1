import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Comment } from '@/types';
import { formatDate } from '@/shared/utils/format';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';

interface CommentItemProps {
  comment: Comment;
  onDelete?: (id: number) => void;
  onEdit?: (id: number, content: string) => void;
  canEdit?: boolean;
}

const CommentItemComponent = ({ comment, onDelete, onEdit, canEdit }: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);

  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === comment.content) {
      setIsEditing(false);
      setEditContent(comment.content);
      return;
    }
    if (onEdit) {
      setSaving(true);
      try {
        await onEdit(comment.id, trimmed);
        setIsEditing(false);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  return (
    <View className="bg-cream-50 dark:bg-stone-800 rounded-2xl p-4 mb-3 border border-cream-200 dark:border-stone-700">
      <View className="flex-row justify-between items-center mb-2">
        <View className="bg-mint-100 dark:bg-mint-900/40 px-3 py-1 rounded-full">
          <Text className="text-sm font-semibold text-mint-700 dark:text-mint-300">
            {comment.display_name ?? comment.author}
          </Text>
        </View>
        <Text className="text-xs text-gray-400 dark:text-stone-500">
          {formatDate(comment.created_at)}
        </Text>
      </View>

      {isEditing ? (
        <View className="mt-2">
          <Input
            value={editContent}
            onChangeText={setEditContent}
            placeholder="댓글 내용"
            multiline
            maxLength={1000}
            className="max-h-24 mb-2"
          />
          <View className="flex-row gap-2 self-end">
            <Pressable onPress={handleCancelEdit} className="px-3 py-1.5 active:opacity-70">
              <Text className="text-sm text-gray-600 dark:text-stone-400">취소</Text>
            </Pressable>
            <Button
              title="저장"
              onPress={handleSaveEdit}
              loading={saving}
              disabled={saving || !editContent.trim()}
              size="sm"
            />
          </View>
        </View>
      ) : (
        <>
          <Text className="text-base text-gray-700 dark:text-stone-200 leading-6">
            {comment.content}
          </Text>
          {canEdit && (onEdit || onDelete) && (
            <View className="flex-row gap-3 mt-3 self-end">
              {onEdit && (
                <Pressable
                  onPress={() => setIsEditing(true)}
                  className="active:opacity-70"
                  accessibilityLabel="댓글 수정"
                  accessibilityHint="이 댓글을 수정합니다"
                  accessibilityRole="button">
                  <Text className="text-sm text-happy-700 dark:text-happy-400 font-semibold">
                    수정
                  </Text>
                </Pressable>
              )}
              {onDelete && (
                <Pressable
                  onPress={() => onDelete(comment.id)}
                  className="active:opacity-70"
                  accessibilityLabel="댓글 삭제"
                  accessibilityHint="이 댓글을 삭제합니다"
                  accessibilityRole="button">
                  <Text className="text-sm text-coral-500 font-semibold">삭제</Text>
                </Pressable>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
};
CommentItemComponent.displayName = 'CommentItem';
export const CommentItem = React.memo(CommentItemComponent);
