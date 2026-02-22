# Supabase 마이그레이션

DB 스키마와 RLS 정책은 **번호 순서대로** 적용해야 합니다.
Supabase CLI 사용 시 `supabase db push` 또는 `supabase migration up`으로 자동 적용됩니다.

## 마이그레이션 목록

| 순서 | 파일 | 요약 |
|------|------|------|
| 1 | `001_schema.sql` | 통합 스키마: groups, boards, group_members, posts, comments, reactions, app_admin, 인덱스·CHECK·updated_at 트리거·소프트 삭제·뷰·스팸 방지·cleanup_orphan_group_members |
| 2 | `002_rls.sql` | RLS 정책 최종: posts, comments, reactions, boards, groups, group_members, app_admin (auth.uid() 캐싱·그룹 멤버십·관리자 제한) |
| 3 | `003_grants.sql` | anon/authenticated 권한 부여 + posts_with_like_count SELECT |

## 최종 스키마 요약

```
posts           — 게시글 (소프트 삭제, updated_at 자동 갱신)
comments        — 댓글 (소프트 삭제, updated_at 자동 갱신)
reactions       — 반응 (좋아요/하트/웃음)
boards          — 게시판 (공개/비공개, 익명 모드, group_id)
groups          — 그룹 (초대 코드 기반)
group_members   — 그룹 멤버십 (역할, 상태, 닉네임, 소프트 탈퇴 left_at)
app_admin       — 앱 관리자 (SQL Editor로만 등록)
```

## 주요 기능

- **멱등성**: IF NOT EXISTS, DROP IF EXISTS 패턴으로 재실행 가능
- **소프트 삭제**: posts/comments의 `deleted_at`, RLS에서 필터링
- **updated_at 자동 갱신**: BEFORE UPDATE 트리거 (posts, comments, boards, groups)
- **RLS 성능**: `(SELECT auth.uid())` 캐싱, `idx_group_members_lookup` 복합 인덱스
- **스팸 방지**: 사용자당 일일 게시글 50건·댓글 100건 제한
- **group_members 소프트 탈퇴**: 탈퇴 시 `status='left'`, `left_at` 기록. 재가입 시 같은 행을 `approved`로 복구
- **오래된 익명 사용자 정리**: `cleanup_orphan_group_members(days_inactive)` (기본 180일)

## group_members 정리 함수 실행 (선택)

오래 로그인하지 않은 익명 사용자의 `group_members` 행을 정리하려면 Supabase 대시보드 SQL Editor에서 주기적으로 실행하세요.

```sql
SELECT public.cleanup_orphan_group_members(180);
```

## Supabase 대시보드에서 수동 설정

### 1. 관리자 등록

```sql
INSERT INTO app_admin (user_id) VALUES ('관리자-uuid');
```

### 2. 기본 공개 게시판 생성

```sql
INSERT INTO boards (name, description, visibility, anon_mode)
VALUES ('자유게시판', '따뜻한 이야기를 나누는 곳', 'public', 'always_anon');
```

### 3. Realtime 활성화

Database > Replication에서 `posts`, `comments`, `reactions` 테이블 Realtime 활성화.

## 참고 문서

- [docs/supabase_setup.md](../docs/supabase_setup.md) — 상세 설정 가이드
- [architecture_v2_groups.md](../../architecture_v2_groups.md) — 그룹 아키텍처 설계
