# Supabase 마이그레이션

DB 스키마와 RLS 정책은 `supabase db push` 로 자동 적용됩니다.

## 마이그레이션 파일

| 파일 | 내용 |
|------|------|
| `migrations/20260301000001_schema.sql` | 확장, 함수, 테이블, 인덱스, 뷰, 트리거 |
| `migrations/20260301000002_rls.sql`    | RLS 활성화 + 전체 정책 |
| `migrations/20260301000003_infra.sql`  | 권한(grants) + Storage 버킷·정책 (조건부 실행) |
| `migrations/20260302000000_fix_rls_update_policies.sql` | posts/comments UPDATE 정책 수정 (deleted_at 충돌 해소) |
| `migrations/20260303000001_core_redesign.sql` | toggle_reaction RPC, soft_delete RPC, group_members 정책 확장, FK CASCADE 수정, 제약조건·인덱스 추가 |
| `migrations/20260303000002_fix_group_members_recursion.sql` | group_members SELECT 재귀 무한루프 수정 — `is_group_member()` SECURITY DEFINER 함수 도입, posts/comments SELECT 정책 갱신 |

> 이전 마이그레이션 이력(001~023, 20260223110128, 20260301000000)은 베이스라인 3개 파일로 통합됨.

## 스키마 요약

```
posts           — 게시글 (소프트 삭제, updated_at 자동 갱신)
comments        — 댓글 (소프트 삭제, updated_at 자동 갱신)
reactions       — 반응 집계 (post_id, reaction_type, count)
user_reactions  — 사용자별 반응 기록 (toggle_reaction RPC로 관리)
boards          — 게시판 (공개/비공개, 익명 모드, group_id)
groups          — 그룹 (초대 코드 기반)
group_members   — 그룹 멤버십 (역할, 상태, 닉네임, 소프트 탈퇴 left_at)
app_admin       — 앱 관리자
post_analysis   — 게시글 감정 분석 결과 (Edge Function 자동 호출)
```

## 대시보드 수동 설정

### 관리자 등록
```sql
INSERT INTO app_admin (user_id) VALUES ('관리자-uuid');
```

### 기본 공개 게시판 생성
```sql
INSERT INTO boards (name, description, visibility, anon_mode)
VALUES ('자유게시판', '따뜻한 이야기를 나누는 곳', 'public', 'always_anon');
```

### Realtime 활성화
Database > Replication에서 `posts`, `comments`, `reactions`, `user_reactions`, `post_analysis` 테이블 활성화.

### RPC 함수
- `toggle_reaction(p_post_id, p_type)` — 반응 토글 (SECURITY DEFINER)
- `get_post_reactions(p_post_id)` — 게시글 반응 조회 (사용자 반응 여부 포함)
- `soft_delete_post(p_post_id)` — 게시글 소프트 삭제
- `soft_delete_comment(p_comment_id)` — 댓글 소프트 삭제
- `is_group_member(p_group_id)` — 그룹 멤버십 확인 (SECURITY DEFINER, RLS 재귀 방지)

### 오래된 익명 사용자 정리 (선택, 주기적 실행)
```sql
SELECT public.cleanup_orphan_group_members(180);
```

## 참고 문서
- [docs/supabase_setup.md](../docs/supabase_setup.md)
- [supabase/functions/CONSOLE_SETUP.md](../functions/CONSOLE_SETUP.md) — Edge Function·Webhook 설정
