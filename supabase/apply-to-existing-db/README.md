# 기존 Supabase DB에 마이그레이션 적용

이 폴더는 이미 운영 중인 Supabase 프로젝트에 `migrations/` 스키마를 적용하기 위한 안내와 보조 스크립트입니다.

---

## 빠른 적용 (CLI)

```bash
# 프로젝트 루트에서, supabase link 된 상태에서
npm run db:push
# 또는
supabase db push
```

이미 적용된 마이그레이션은 자동으로 건너뛰고 미적용 항목만 적용됩니다.

- 적용 전 상태 확인: `npm run db:migration-list`
- PowerShell 스크립트: `.\supabase\apply-to-existing-db\scripts\apply.ps1`

---

## 마이그레이션 목록

| 파일 | 내용 |
|------|------|
| `20260301000001_baseline.sql` | **통합 베이스라인** — 전체 스키마(테이블, 인덱스, 트리거, 뷰), RLS, 권한, Storage 버킷을 단일 파일로 정의 |

> 이전 이력(001~023, 20260223110128, 20260301000000)은 모두 이 베이스라인으로 통합됨.

---

## 적용 전 상태 확인

### CLI (권장)
```bash
supabase migration list
```
Local, Remote 모두에 `20260301000001`이 있으면 이미 적용됨.

### SQL Editor
`check_applied.sql` 파일을 Supabase 대시보드 SQL Editor에서 실행하면 주요 객체 존재 여부를 확인할 수 있습니다.

---

## 수동 적용 (SQL Editor)

CLI를 사용할 수 없을 때 [APPLY_ORDER.txt](./APPLY_ORDER.txt) 순서대로 파일을 SQL Editor에서 실행합니다.

---

## 적용 후 수동 설정

자세한 내용은 [supabase/README.md](../README.md) 참고.

- **관리자 등록**: `INSERT INTO app_admin (user_id) VALUES ('uuid');`
- **기본 게시판**: `INSERT INTO boards ...`
- **Realtime**: Database > Replication에서 posts, comments, reactions 활성화
- **Edge Function·Webhook**: `supabase/functions/CONSOLE_SETUP.md` 참고
