export type AnonMode = 'always_anon' | 'allow_choice' | 'require_name';

export interface ResolveDisplayNameParams {
  anonMode: AnonMode;
  rawAuthorName?: string | null;
  userId?: string | null;
  boardId?: number | null;
  groupId?: number | null;
  /** 사용자가 "닉네임을 공개"하도록 선택했는지 여부 (allow_choice에서 사용) */
  wantNameOverride?: boolean;
}

export interface ResolveDisplayNameResult {
  isAnonymous: boolean;
  displayName: string;
}

const ADJECTIVES = ['따뜻한', '조용한', '빛나는', '단단한', '부드러운'];
const ANIMALS = ['고래', '여우', '부엉이', '고양이', '새'];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function generateAlias(seed: string | null | undefined): string {
  if (!seed) return '익명';
  const hash = hashString(seed);
  const adj = ADJECTIVES[hash % ADJECTIVES.length];
  const animal = ANIMALS[(hash >>> 8) % ANIMALS.length];
  const num = (hash % 9) + 1;
  return `${adj} ${animal} ${num}`;
}

export function resolveDisplayName(params: ResolveDisplayNameParams): ResolveDisplayNameResult {
  const { anonMode, rawAuthorName, wantNameOverride, userId, boardId, groupId } = params;
  const trimmedName = rawAuthorName?.trim();

  const seed =
    userId && groupId != null
      ? `${userId}:group:${groupId}`
      : userId && boardId != null
        ? `${userId}:board:${boardId}`
        : userId || null;

  // helper
  const anonymous = (): ResolveDisplayNameResult => ({
    isAnonymous: true,
    displayName: generateAlias(seed),
  });

  const withName = (): ResolveDisplayNameResult => ({
    isAnonymous: false,
    displayName: trimmedName && trimmedName.length > 0 ? trimmedName : '사용자',
  });

  switch (anonMode) {
    case 'always_anon':
      return anonymous();
    case 'require_name':
      return withName();
    case 'allow_choice':
    default:
      if (wantNameOverride && trimmedName && trimmedName.length > 0) {
        return withName();
      }
      return anonymous();
  }
}
