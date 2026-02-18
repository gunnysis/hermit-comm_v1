# Supabase 마이그레이션

DB 스키마와 RLS 정책은 **아래 순서대로** 적용해야 합니다. Supabase CLI 사용 시 `supabase db migrate up`으로 자동 적용됩니다.

| 순서 | 파일 | 요약 |
|------|------|------|
| 1 | `001_initial_schema.sql` | posts, comments, reactions 테이블 및 기본 RLS(전체 허용) |
| 2 | `002_add_auth_and_rls.sql` | author_id 추가, auth.uid() 기반 RLS로 정책 교체 |
| 3 | `003_add_update_policies_and_views.sql` | 수정(UPDATE) 정책, 인기순 정렬용 뷰 `posts_with_like_count` |
| 4 | `004_anonymous_board_schema.sql` | boards, groups, group_members 테이블, posts/comments에 board_id·group_id·익명 컬럼 |
| 5 | `005_board_enums_and_indexes.sql` | visibility·anon_mode·join_mode 등 CHECK 제약, 게시판별 인덱스 |
| 6 | `006_group_board_rls.sql` | 그룹 게시판 읽기 RLS(승인 멤버만 posts/comments 조회) |
| 7 | `007_boards_group_id.sql` | boards에 group_id 추가(그룹 전용 게시판) |
| 8 | `008_admin_rls.sql` | app_admin 테이블, groups/boards INSERT는 app_admin 등록자만 |

상세 설정(기본 게시판 생성, 관리자 등록, Realtime)은 [docs/supabase_setup.md](../docs/supabase_setup.md)를 참고하세요.
