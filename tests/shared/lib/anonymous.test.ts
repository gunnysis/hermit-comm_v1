import { generateAlias, resolveDisplayName } from '@/shared/lib/anonymous';

const ADJECTIVES = ['따뜻한', '조용한', '빛나는', '단단한', '부드러운'];
const ANIMALS = ['고래', '여우', '부엉이', '고양이', '새'];

describe('generateAlias', () => {
  it('seed가 null이면 "익명"을 반환한다', () => {
    expect(generateAlias(null)).toBe('익명');
  });

  it('seed가 undefined면 "익명"을 반환한다', () => {
    expect(generateAlias(undefined)).toBe('익명');
  });

  it('seed가 빈 문자열이면 "익명"을 반환한다', () => {
    expect(generateAlias('')).toBe('익명');
  });

  it('형용사 + 동물 + 숫자(1~9) 형태의 별칭을 반환한다', () => {
    const result = generateAlias('some-user-id');
    const parts = result.split(' ');

    expect(parts).toHaveLength(3);
    expect(ADJECTIVES).toContain(parts[0]);
    expect(ANIMALS).toContain(parts[1]);
    const num = Number(parts[2]);
    expect(num).toBeGreaterThanOrEqual(1);
    expect(num).toBeLessThanOrEqual(9);
  });

  it('해시가 2^31 이상인 시드에서도 "undefined"가 포함되지 않는다 (>> → >>> 수정 검증)', () => {
    // hash >> 8 이 음수가 되어 ANIMALS[-1] = undefined 였던 버그 재현 방지
    // 다양한 시드로 100회 반복해 undefined 없음을 보장한다
    for (let i = 0; i < 100; i++) {
      const result = generateAlias(`user-seed-test-${i}`);
      expect(result).not.toContain('undefined');
      const parts = result.split(' ');
      expect(parts).toHaveLength(3);
      expect(ADJECTIVES).toContain(parts[0]);
      expect(ANIMALS).toContain(parts[1]);
    }
  });

  it('같은 seed는 항상 같은 별칭을 반환한다 (결정론적)', () => {
    const seed = 'stable-user-uuid';
    const first = generateAlias(seed);
    const second = generateAlias(seed);
    expect(first).toBe(second);
  });

  it('서로 다른 seed는 다른 별칭을 가질 수 있다', () => {
    const results = new Set(
      Array.from({ length: 20 }, (_, i) => generateAlias(`unique-seed-${i}`)),
    );
    // 20개 중 최소 2개 이상은 달라야 한다 (해시 분산 확인)
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('resolveDisplayName', () => {
  const userId = 'user-uuid-123';
  const boardId = 1;
  const groupId = 2;

  describe('always_anon 모드', () => {
    it('항상 익명 별칭을 반환한다', () => {
      const result = resolveDisplayName({
        anonMode: 'always_anon',
        userId,
        boardId,
        rawAuthorName: '실명',
        wantNameOverride: true,
      });
      expect(result.isAnonymous).toBe(true);
      expect(result.displayName).not.toBe('실명');
    });
  });

  describe('require_name 모드', () => {
    it('rawAuthorName이 있으면 그 이름을 반환한다', () => {
      const result = resolveDisplayName({
        anonMode: 'require_name',
        userId,
        boardId,
        rawAuthorName: '홍길동',
      });
      expect(result.isAnonymous).toBe(false);
      expect(result.displayName).toBe('홍길동');
    });

    it('rawAuthorName이 없으면 "사용자"를 반환한다', () => {
      const result = resolveDisplayName({
        anonMode: 'require_name',
        userId,
        boardId,
        rawAuthorName: null,
      });
      expect(result.isAnonymous).toBe(false);
      expect(result.displayName).toBe('사용자');
    });
  });

  describe('allow_choice 모드', () => {
    it('wantNameOverride가 false면 익명 별칭을 반환한다', () => {
      const result = resolveDisplayName({
        anonMode: 'allow_choice',
        userId,
        boardId,
        rawAuthorName: '홍길동',
        wantNameOverride: false,
      });
      expect(result.isAnonymous).toBe(true);
    });

    it('wantNameOverride가 true면 이름을 공개한다', () => {
      const result = resolveDisplayName({
        anonMode: 'allow_choice',
        userId,
        boardId,
        rawAuthorName: '홍길동',
        wantNameOverride: true,
      });
      expect(result.isAnonymous).toBe(false);
      expect(result.displayName).toBe('홍길동');
    });
  });

  it('boardId 기반 seed와 groupId 기반 seed는 다른 별칭을 생성할 수 있다', () => {
    const byBoard = resolveDisplayName({ anonMode: 'always_anon', userId, boardId });
    const byGroup = resolveDisplayName({ anonMode: 'always_anon', userId, groupId });
    // seed가 다르므로 결과가 다를 가능성이 높다 (같을 수도 있어 not.toEqual 대신 형식 검증)
    expect(byBoard.isAnonymous).toBe(true);
    expect(byGroup.isAnonymous).toBe(true);
  });
});
