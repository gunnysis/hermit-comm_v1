import { formatDate, truncateText, formatReactionCount } from './format';

describe('formatDate', () => {
  beforeEach(() => {
    // 고정된 "현재 시각" 사용 (2025-01-15 12:00:00)
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('1분 미만이면 "방금 전" 반환', () => {
    const date = new Date('2025-01-15T11:59:30.000Z').toISOString();
    expect(formatDate(date)).toBe('방금 전');
  });

  it('1분 이상 60분 미만이면 "N분 전" 반환', () => {
    const date = new Date('2025-01-15T11:30:00.000Z').toISOString();
    expect(formatDate(date)).toBe('30분 전');
  });

  it('1시간 이상 24시간 미만이면 "N시간 전" 반환', () => {
    const date = new Date('2025-01-15T10:00:00.000Z').toISOString();
    expect(formatDate(date)).toBe('2시간 전');
  });

  it('24시간 이상 7일 미만이면 "N일 전" 반환', () => {
    const date = new Date('2025-01-14T12:00:00.000Z').toISOString();
    expect(formatDate(date)).toBe('1일 전');
  });

  it('7일 이상이고 올해면 "MM.DD" 반환', () => {
    const date = new Date('2025-01-01T12:00:00.000Z').toISOString();
    expect(formatDate(date)).toBe('01.01');
  });

  it('작년이면 "YYYY.MM.DD" 반환', () => {
    const date = new Date('2024-12-31T12:00:00.000Z').toISOString();
    expect(formatDate(date)).toBe('2024.12.31');
  });
});

describe('truncateText', () => {
  it('maxLength 이하면 원문 반환', () => {
    expect(truncateText('hello', 10)).toBe('hello');
    expect(truncateText('hello', 5)).toBe('hello');
  });

  it('maxLength 초과면 잘라서 "..." 붙여 반환', () => {
    expect(truncateText('hello world', 5)).toBe('hello...');
    expect(truncateText('가나다라마', 3)).toBe('가나다...');
  });
});

describe('formatReactionCount', () => {
  it('1000 미만이면 그대로 문자열 반환', () => {
    expect(formatReactionCount(0)).toBe('0');
    expect(formatReactionCount(999)).toBe('999');
  });

  it('1000 이상 10000 미만이면 "N.k" 형식', () => {
    expect(formatReactionCount(1000)).toBe('1.0k');
    expect(formatReactionCount(1500)).toBe('1.5k');
  });

  it('10000 이상이면 "Nk" 형식 (소수 없음)', () => {
    expect(formatReactionCount(10000)).toBe('10k');
    expect(formatReactionCount(12345)).toBe('12k');
  });
});
