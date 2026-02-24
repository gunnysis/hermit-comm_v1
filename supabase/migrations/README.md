# Supabase 마이그레이션

DB 스키마와 RLS 정책은 **번호 순서대로** 적용해야 합니다.
Supabase CLI 사용 시 `supabase db push` 또는 `supabase migration up`으로 자동 적용됩니다.

## 마이그레이션 목록

| 순서 | 파일 | 요약 |
|------|------|------|
| 1 | `001_schema.sql` | 통합 스키마: groups, boards, group_members, posts, comments, reactions, app_admin, 인덱스·CHECK·updated_at 트리거·소프트 삭제·뷰·스팸 방지·cleanup_orphan_group_members |
| 2 | `002_rls.sql` | RLS 정책 최종: posts, comments, reactions, boards, groups, group_members, app_admin (auth.uid() 캐싱·그룹 멤버십·관리자 제한) |
| 3 | `003_grants.sql` | anon/authenticated 권한 부여 + posts_with_like_count SELECT |
| … | `009`–`011` | (기존 마이그레이션) |
| 12 | `012_group_delete_rls.sql` | groups DELETE RLS(본인 소유+app_admin), posts/comments board_id ON DELETE CASCADE |
| 13 | `013_fix_view_image_url.sql` | posts_with_like_count 뷰에 image_url 추가 |
| 14 | `014_recommend_posts_by_emotion.sql` | get_recommended_posts_by_emotion(post_id, limit) RPC — 감정 기반 추천 |
| 15 | `015_webhook_analyze_post_trigger.sql` | posts INSERT 시 analyze-post Edge Function 호출 트리거 (CONSOLE_SETUP §4 대체) |
| 16 | `016_analyze_post_trigger_auth.sql` | 트리거 제거. 감정 분석 자동 호출은 Database Webhook(posts INSERT → analyze-post)으로 설정 |
| 17 | `017_storage_post_images.sql` | Storage 버킷 post-images 생성 및 RLS (이미지 업로드·공개 읽기) |
| 18 | `018_posts_webhook_trigger.sql` | (선택) posts INSERT 시 pg_net으로 analyze-post 호출 트리거 — 프로젝트 URL 포함, Dashboard Webhook 대체용 |
| 19 | `019_post_analysis_service_role_grant.sql` | post_analysis 테이블 service_role 쓰기 권한 부여 |
| 20 | `020_service_role_full_grant.sql` | public 스키마 전체 테이블·시퀀스 service_role 권한 부여 |
| 21 | `021_user_reactions.sql` | user_reactions 테이블 (사용자별 반응 추적, 연타 방지·취소 기능용) |
| 22 | `022_reactions_delete_policy.sql` | reactions 테이블 DELETE RLS 정책 추가 (반응 취소 시 count=0 행 삭제 허용) |
| — | `20260223110128_remote_commit.sql` | Supabase CLI 자동 생성 스냅샷 (원격 DB 상태 기록용, 수동 적용 불필요) |

## 최종 스키마 요약

```
posts           — 게시글 (소프트 삭제, updated_at 자동 갱신)
comments        — 댓글 (소프트 삭제, updated_at 자동 갱신)
reactions       — 반응 (좋아요/하트/웃음) 집계
user_reactions  — 사용자별 반응 기록 (연타 방지·취소용, 021 / DELETE RLS 022)
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
