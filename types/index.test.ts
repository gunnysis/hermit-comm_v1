import { isPost, isComment, type Post, type Comment } from './index';

describe('isPost', () => {
  const validPost: Post = {
    id: 1,
    title: '제목',
    content: '내용',
    author: '작성자',
    author_id: 'uuid-here',
    created_at: '2025-01-01T00:00:00.000Z',
  };

  it('유효한 Post 객체면 true 반환', () => {
    expect(isPost(validPost)).toBe(true);
  });

  it('null이면 false 반환', () => {
    expect(isPost(null)).toBe(false);
  });

  it('배열이면 false 반환', () => {
    expect(isPost([])).toBe(false);
  });

  it('id가 숫자가 아니면 false 반환', () => {
    expect(isPost({ ...validPost, id: '1' as unknown as number })).toBe(false);
  });

  it('title이 없으면 false 반환', () => {
    expect(isPost({ ...validPost, title: undefined })).toBe(false);
  });

  it('author_id가 없으면 false 반환', () => {
    expect(isPost({ ...validPost, author_id: undefined })).toBe(false);
  });
});

describe('isComment', () => {
  const validComment: Comment = {
    id: 1,
    post_id: 10,
    content: '댓글',
    author: '작성자',
    author_id: 'uuid-here',
    created_at: '2025-01-01T00:00:00.000Z',
  };

  it('유효한 Comment 객체면 true 반환', () => {
    expect(isComment(validComment)).toBe(true);
  });

  it('null이면 false 반환', () => {
    expect(isComment(null)).toBe(false);
  });

  it('post_id가 숫자가 아니면 false 반환', () => {
    expect(
      isComment({ ...validComment, post_id: '10' as unknown as number })
    ).toBe(false);
  });

  it('content가 없으면 false 반환', () => {
    expect(isComment({ ...validComment, content: undefined })).toBe(false);
  });
});
