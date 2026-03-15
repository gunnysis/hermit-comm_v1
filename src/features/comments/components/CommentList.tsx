import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Comment } from '@/types';
import { CommentItem } from './CommentItem';
import { EmptyState } from '@/shared/components/EmptyState';

interface CommentListProps {
  comments: Comment[];
  onDelete?: (id: number) => void;
  onEdit?: (id: number, content: string) => Promise<void>;
  onReply?: (parentId: number) => void;
  currentUserId?: string;
}

function CommentListEmpty() {
  return <EmptyState icon="💬" title="아직 댓글이 없습니다." description="첫 댓글을 남겨주세요." />;
}

export function CommentList({
  comments,
  onDelete,
  onEdit,
  onReply,
  currentUserId,
}: CommentListProps) {
  const { topLevel, repliesMap } = useMemo(() => {
    const top: Comment[] = [];
    const map = new Map<number, Comment[]>();

    for (const c of comments) {
      if (c.parent_id) {
        const list = map.get(c.parent_id);
        if (list) {
          list.push(c);
        } else {
          map.set(c.parent_id, [c]);
        }
      } else {
        top.push(c);
      }
    }

    return { topLevel: top, repliesMap: map };
  }, [comments]);

  if (comments.length === 0) {
    return <CommentListEmpty />;
  }

  return (
    <View className="px-4">
      {topLevel.map((comment) => (
        <View key={comment.id}>
          <CommentItem
            comment={comment}
            onDelete={onDelete}
            onEdit={onEdit}
            onReply={onReply}
            canEdit={currentUserId === comment.author_id}
          />
          {repliesMap.get(comment.id)?.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onDelete={onDelete}
              onEdit={onEdit}
              canEdit={currentUserId === reply.author_id}
              isReply
            />
          ))}
        </View>
      ))}
    </View>
  );
}
