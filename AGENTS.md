# Cursor Agent — 이 프로젝트 규칙

이 저장소에서는 [CLAUDE.md](CLAUDE.md)와 `.cursor/rules/` 규칙을 따른다.

## 우선 적용

- **검증**: 코드 수정 후 `npm test`와 `npx tsc --noEmit`를 실행한다. 문서·설정만 수정한 경우는 생략 가능하다고만 안내.
- **최소 변경**: 한 번에 한 가지 목표만 처리하고, 요청 범위 밖의 수정은 하지 않는다.
- Supabase/RLS·마이그레이션·E2E 시나리오 변경은 영향 범위가 크므로, 제안 시 "RLS/마이그레이션/E2E 영향"을 명시하고 사용자 확인을 권장한다.

## 수정 시 각별히 확인할 구역

- **RLS/DB**: `supabase/migrations/002_rls.sql`, `src/shared/lib/api/posts.ts`, `src/shared/lib/api/comments.ts`
- **익명/표시**: `src/shared/lib/anonymous.ts`, 보드 `anon_mode`를 쓰는 컴포넌트
- **라우팅**: `src/app/admin/_layout.tsx`, 탭·관리자 진입 로직
- **E2E**: `.maestro/` 시나리오, 초대 코드·관리자 시나리오

고위험 작업은 한 단계씩 진행하거나 Ask 모드로 제안만 받고 직접 적용할 것.
