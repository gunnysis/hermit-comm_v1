import {
  validatePostTitle,
  validatePostContent,
  validateAuthor,
  validateCommentContent,
} from './validate';

describe('validatePostTitle', () => {
  it('빈 문자열이면 isValid false와 에러 메시지 반환', () => {
    expect(validatePostTitle('')).toEqual({
      isValid: false,
      error: '제목을 입력해주세요.',
    });
    expect(validatePostTitle('   ')).toEqual({
      isValid: false,
      error: '제목을 입력해주세요.',
    });
  });

  it('100자 초과면 isValid false 반환', () => {
    const long = '가'.repeat(101);
    expect(validatePostTitle(long)).toEqual({
      isValid: false,
      error: '제목은 100자 이내로 입력해주세요.',
    });
  });

  it('1~100자 제목이면 isValid true 반환', () => {
    expect(validatePostTitle('제목')).toEqual({ isValid: true });
    expect(validatePostTitle('가'.repeat(100))).toEqual({ isValid: true });
  });
});

describe('validatePostContent', () => {
  it('빈 문자열이면 isValid false 반환', () => {
    expect(validatePostContent('')).toEqual({
      isValid: false,
      error: '내용을 입력해주세요.',
    });
  });

  it('5000자 초과면 isValid false 반환', () => {
    const long = '가'.repeat(5001);
    expect(validatePostContent(long)).toEqual({
      isValid: false,
      error: '내용은 5000자 이내로 입력해주세요.',
    });
  });

  it('1~5000자 내용이면 isValid true 반환', () => {
    expect(validatePostContent('내용')).toEqual({ isValid: true });
  });
});

describe('validateAuthor', () => {
  it('빈 문자열이면 isValid false 반환', () => {
    expect(validateAuthor('')).toEqual({
      isValid: false,
      error: '작성자 이름을 입력해주세요.',
    });
  });

  it('50자 초과면 isValid false 반환', () => {
    const long = '가'.repeat(51);
    expect(validateAuthor(long)).toEqual({
      isValid: false,
      error: '작성자 이름은 50자 이내로 입력해주세요.',
    });
  });

  it('1~50자 이름이면 isValid true 반환', () => {
    expect(validateAuthor('닉네임')).toEqual({ isValid: true });
  });
});

describe('validateCommentContent', () => {
  it('빈 문자열이면 isValid false 반환', () => {
    expect(validateCommentContent('')).toEqual({
      isValid: false,
      error: '댓글을 입력해주세요.',
    });
  });

  it('1000자 초과면 isValid false 반환', () => {
    const long = '가'.repeat(1001);
    expect(validateCommentContent(long)).toEqual({
      isValid: false,
      error: '댓글은 1000자 이내로 입력해주세요.',
    });
  });

  it('1~1000자 댓글이면 isValid true 반환', () => {
    expect(validateCommentContent('댓글')).toEqual({ isValid: true });
  });
});
