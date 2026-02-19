# Supabase 마이그레이션

DB 스키마와 RLS 정책은 **번호 순서대로** 적용해야 합니다.
Supabase CLI 사용 시 `supabase db push` 또는 `supabase migration up`으로 자동 적용됩니다.

## 마이그레이션 목록

| 순서 | 파일 | 요약 |
|------|------|------|
| 1 | `001_initial_schema.sql` | posts, comments, reactions 테이블 + 인덱스 + RLS(전체 허용) |
| 2 | `002_add_auth_and_rls.sql` | author_id 추가, auth.uid() 기반 RLS로 정책 교체 |
| 3 | `003_add_update_policies_and_views.sql` | UPDATE 정책, `posts_with_like_count` 뷰 (초기 버전) |
| 4 | `004_anonymous_board_schema.sql` | boards, groups, group_members 테이블, 익명 컬럼 |
| 5 | `005_board_enums_and_indexes.sql` | CHECK 제약 (visibility, anon_mode, join_mode, role, status) |
| 6 | `006_group_board_rls.sql` | 그룹 멤버십 기반 읽기 RLS (010에서 최적화 버전으로 교체) |
| 7 | `007_boards_group_id.sql` | boards에 group_id FK 추가 (그룹 전용 게시판) |
| 8 | `008_admin_rls.sql` | app_admin 테이블, groups/boards INSERT 관리자 제한 |
| 9 | `009_schema_improvements.sql` | updated_at 트리거, 소프트 삭제, group_members 확장, 뷰 재생성 |
| 10 | `010_rls_performance.sql` | `(select auth.uid())` 캐싱 패턴, 복합 인덱스, 최종 RLS 정책 |
| 11 | `011_spam_prevention.sql` | 일일 게시글(50건)/댓글(100건) 제한 트리거 |

## 최종 스키마 요약

```
posts           — 게시글 (소프트 삭제, updated_at 자동 갱신)
comments        — 댓글 (소프트 삭제, updated_at 자동 갱신)
reactions       — 반응 (좋아요/하트/웃음)
boards          — 게시판 (공개/비공개, 익명 모드)
groups          — 그룹 (초대 코드 기반)
group_members   — 그룹 멤버십 (역할, 상태, 닉네임)
app_admin       — 앱 관리자 (SQL Editor로만 등록)
```

## 주요 기능

- **멱등성**: 모든 마이그레이션이 재실행 가능 (IF NOT EXISTS, DROP IF EXISTS 패턴)
- **소프트 삭제**: posts/comments에 `deleted_at` 컬럼, RLS에서 자동 필터링
- **updated_at 자동 갱신**: BEFORE UPDATE 트리거 (posts, comments, boards, groups)
- **RLS 성능 최적화**: `(select auth.uid())` 캐싱, `idx_group_members_lookup` 복합 인덱스
- **스팸 방지**: 사용자당 일일 게시글 50건, 댓글 100건 제한

## Supabase 대시보드에서 수동 설정이 필요한 항목

### 1. 관리자 등록

SQL Editor에서 실행:

```sql
INSERT INTO app_admin (user_id) VALUES ('관리자-uuid');
```

### 2. 기본 공개 게시판 생성

```sql
INSERT INTO boards (name, description, visibility, anon_mode)
VALUES ('자유게시판', '따뜻한 이야기를 나누는 곳', 'public', 'always_anon');
```

### 3. Realtime 활성화

Supabase 대시보드 > Database > Replication에서 다음 테이블의 Realtime을 활성화:

- `posts`
- `comments`
- `reactions`

## 참고 문서

- [docs/supabase_setup.md](../docs/supabase_setup.md) — 상세 설정 가이드
- [architecture_v2_groups.md](../../architecture_v2_groups.md) — 그룹 아키텍처 설계
