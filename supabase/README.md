# Supabase 마이그레이션

DB 스키마와 RLS 정책은 `supabase db push` 로 자동 적용됩니다.

## 마이그레이션 파일

| 파일 | 내용 |
|------|------|
| `migrations/20260301000001_baseline.sql` | **통합 베이스라인** — 전체 스키마, RLS, 권한, Storage 버킷을 단일 파일로 정의 |

> 이전 마이그레이션 이력(001~023, 20260223110128, 20260301000000)은 모두 이 베이스라인으로 통합됨.
> 원격 DB에는 `migration repair`로 베이스라인 하나만 적용된 상태로 정리되어 있음.

## 스키마 요약

```
posts           — 게시글 (소프트 삭제, updated_at 자동 갱신)
comments        — 댓글 (소프트 삭제, updated_at 자동 갱신)
reactions       — 반응(좋아요) 집계 (reaction_type = 'like')
user_reactions  — 사용자별 반응 기록 (연타 방지·취소용)
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
Database > Replication에서 `posts`, `comments`, `reactions` 테이블 활성화.

### 오래된 익명 사용자 정리 (선택, 주기적 실행)
```sql
SELECT public.cleanup_orphan_group_members(180);
```

## 참고 문서
- [docs/supabase_setup.md](../docs/supabase_setup.md)
- [supabase/functions/CONSOLE_SETUP.md](../functions/CONSOLE_SETUP.md) — Edge Function·Webhook 설정
