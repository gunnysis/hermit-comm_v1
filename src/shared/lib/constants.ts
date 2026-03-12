/** 공개 게시판 기본 ID. 자유게시판 (visibility='public') */
export const DEFAULT_PUBLIC_BOARD_ID = 12;

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

/** 페이지당 게시글 수 */
export const PAGE_SIZE = 20;

// 공유 상수는 중앙 프로젝트에서 생성됨 (constants.generated.ts)
export {
  ALLOWED_EMOTIONS,
  EMOTION_EMOJI,
  REACTION_COLOR_MAP,
  SHARED_PALETTE,
  EMOTION_COLOR_MAP,
  MOTION,
  EMPTY_STATE_MESSAGES,
  GREETING_MESSAGES,
  SEARCH_HIGHLIGHT,
  SEARCH_CONFIG,
  ADMIN_CONSTANTS,
  ANALYSIS_STATUS,
  ANALYSIS_CONFIG,
  VALIDATION,
} from './constants.generated';
export type { AllowedEmotion, ReactionColorKey } from './constants.generated';
