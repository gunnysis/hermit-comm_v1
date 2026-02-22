import React from 'react';
import { FlashList } from '@shopify/flash-list';
import { Comment } from '@/types';
import { CommentItem } from './CommentItem';
import { EmptyState } from '@/shared/components/EmptyState';

interface CommentListProps {
  comments: Comment[];
  onDelete?: (id: number) => void;
  onEdit?: (id: number, content: string) => Promise<void>;
  currentUserId?: string;
}

function CommentListEmpty() {
  return <EmptyState icon="💬" title="아직 댓글이 없습니다." description="첫 댓글을 남겨주세요." />;
}

export function CommentList({ comments, onDelete, onEdit, currentUserId }: CommentListProps) {
  if (comments.length === 0) {
    return <CommentListEmpty />;
  }

  return (
    <FlashList
      data={comments}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <CommentItem
          comment={item}
          onDelete={onDelete}
          onEdit={onEdit}
          canEdit={currentUserId === item.author_id}
        />
      )}
      ListEmptyComponent={CommentListEmpty}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    />
  );
}
