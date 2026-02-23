import { postSchema, commentSchema, searchSchema } from './schemas';
import { VALIDATION } from './constants';

describe('postSchema', () => {
  it('유효한 데이터를 통과시킨다', () => {
    const result = postSchema.safeParse({ title: '제목', content: '내용' });
    expect(result.success).toBe(true);
  });

  it('author 없이도 통과한다', () => {
    const result = postSchema.safeParse({ title: '제목', content: '내용' });
    expect(result.success).toBe(true);
  });

  it('제목이 비어 있으면 실패한다', () => {
    const result = postSchema.safeParse({ title: '', content: '내용' });
    expect(result.success).toBe(false);
  });

  it('내용이 비어 있으면 실패한다', () => {
    const result = postSchema.safeParse({ title: '제목', content: '' });
    expect(result.success).toBe(false);
  });

  it(`제목이 ${VALIDATION.POST_TITLE_MAX}자를 초과하면 실패한다`, () => {
    const result = postSchema.safeParse({
      title: 'a'.repeat(VALIDATION.POST_TITLE_MAX + 1),
      content: '내용',
    });
    expect(result.success).toBe(false);
  });

  it(`제목이 정확히 ${VALIDATION.POST_TITLE_MAX}자이면 통과한다`, () => {
    const result = postSchema.safeParse({
      title: 'a'.repeat(VALIDATION.POST_TITLE_MAX),
      content: '내용',
    });
    expect(result.success).toBe(true);
  });

  it(`내용이 ${VALIDATION.POST_CONTENT_MAX}자를 초과하면 실패한다`, () => {
    const result = postSchema.safeParse({
      title: '제목',
      content: 'a'.repeat(VALIDATION.POST_CONTENT_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it(`author가 ${VALIDATION.AUTHOR_MAX}자를 초과하면 실패한다`, () => {
    const result = postSchema.safeParse({
      title: '제목',
      content: '내용',
      author: 'a'.repeat(VALIDATION.AUTHOR_MAX + 1),
    });
    expect(result.success).toBe(false);
  });
});

describe('commentSchema', () => {
  it('유효한 댓글을 통과시킨다', () => {
    const result = commentSchema.safeParse({ content: '좋은 글이네요.' });
    expect(result.success).toBe(true);
  });

  it('댓글이 비어 있으면 실패한다', () => {
    const result = commentSchema.safeParse({ content: '' });
    expect(result.success).toBe(false);
  });

  it(`댓글이 ${VALIDATION.COMMENT_MAX}자를 초과하면 실패한다`, () => {
    const result = commentSchema.safeParse({ content: 'a'.repeat(VALIDATION.COMMENT_MAX + 1) });
    expect(result.success).toBe(false);
  });

  it(`댓글이 정확히 ${VALIDATION.COMMENT_MAX}자이면 통과한다`, () => {
    const result = commentSchema.safeParse({ content: 'a'.repeat(VALIDATION.COMMENT_MAX) });
    expect(result.success).toBe(true);
  });
});

describe('searchSchema', () => {
  it('빈 쿼리를 기본값으로 통과시킨다', () => {
    const result = searchSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe('');
    }
  });

  it('200자 이하 쿼리를 통과시킨다', () => {
    const result = searchSchema.safeParse({ query: '검색어' });
    expect(result.success).toBe(true);
  });

  it('200자 초과 쿼리는 실패한다', () => {
    const result = searchSchema.safeParse({ query: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe('validate.ts와 schemas.ts 규칙 일관성', () => {
  it('제목 최대 길이가 VALIDATION.POST_TITLE_MAX와 같다', () => {
    const maxOk = postSchema.safeParse({
      title: 'a'.repeat(VALIDATION.POST_TITLE_MAX),
      content: '내용',
    });
    const maxFail = postSchema.safeParse({
      title: 'a'.repeat(VALIDATION.POST_TITLE_MAX + 1),
      content: '내용',
    });
    expect(maxOk.success).toBe(true);
    expect(maxFail.success).toBe(false);
  });

  it('내용 최대 길이가 VALIDATION.POST_CONTENT_MAX와 같다', () => {
    const maxOk = postSchema.safeParse({
      title: '제목',
      content: 'a'.repeat(VALIDATION.POST_CONTENT_MAX),
    });
    const maxFail = postSchema.safeParse({
      title: '제목',
      content: 'a'.repeat(VALIDATION.POST_CONTENT_MAX + 1),
    });
    expect(maxOk.success).toBe(true);
    expect(maxFail.success).toBe(false);
  });

  it('댓글 최대 길이가 VALIDATION.COMMENT_MAX와 같다', () => {
    const maxOk = commentSchema.safeParse({ content: 'a'.repeat(VALIDATION.COMMENT_MAX) });
    const maxFail = commentSchema.safeParse({ content: 'a'.repeat(VALIDATION.COMMENT_MAX + 1) });
    expect(maxOk.success).toBe(true);
    expect(maxFail.success).toBe(false);
  });
});
