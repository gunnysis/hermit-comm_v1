/** 공개 게시판 기본 ID. 현재 공개 보드가 하나인 구조. */
export const DEFAULT_PUBLIC_BOARD_ID = 1;

/** 입력 유효성 검사 상수 */
export const VALIDATION = {
  POST_TITLE_MAX: 100,
  POST_CONTENT_MAX: 5000,
  COMMENT_MAX: 1000,
  AUTHOR_MAX: 50,
} as const;

/** 익명 별칭 형용사 목록 */
export const ALIAS_ADJECTIVES = [
  '따뜻한',
  '조용한',
  '빛나는',
  '단단한',
  '부드러운',
  '활기찬',
  '순수한',
  '맑은',
  '깊은',
  '고요한',
] as const;

/** 익명 별칭 동물 목록 */
export const ALIAS_ANIMALS = [
  '고래',
  '여우',
  '부엉이',
  '고양이',
  '새',
  '사슴',
  '하늘소',
  '반딧불',
  '두루미',
  '바람새',
] as const;
