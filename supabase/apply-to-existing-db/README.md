# 기존 Supabase DB에 마이그레이션 적용

이 폴더는 **이미 운영 중인 Supabase 프로젝트**에 `migrations/` 안의 스키마·RLS·함수를 **현재 DB 상태에 맞게** 순서대로 적용하기 위한 안내와 보조 스크립트입니다.

---

## 지금 적용하려면 (연결된 현재 DB)

```bash
# 1) 프로젝트 루트에서, supabase link 된 상태에서
npm run db:push
```

또는 PowerShell에서:

```powershell
.\supabase\apply-to-existing-db\scripts\apply.ps1
```

- 이미 적용된 마이그레이션은 자동으로 건너뛰고, 아직 없는 것만 순서대로 적용됩니다.
- 적용 전 목록만 보려면: `npm run db:migration-list`
- push 실패 시 "Remote migration versions not found..." 메시지가 나오면 [6. 문제 해결](#6-문제-해결) 참고.

---

## 0. Supabase CLI로 현재 DB 확인 (권장)

연결된 원격 DB에 어떤 마이그레이션이 적용돼 있는지 CLI로 확인할 수 있습니다.

```bash
# 프로젝트 루트에서 (supabase link 완료 후)
supabase migration list
```

- **Local**: 이 저장소 `migrations/` 에 있는 파일 (001, 002, 003, 009, 010, 011, 012. 004~008은 없음)
- **Remote**: 원격 DB에 적용된 마이그레이션
- Local과 Remote 모두에 같은 번호가 있으면 **이미 적용됨**. Remote에 없으면 `supabase db push`로 적용 가능.

참고: [migration_list_reference.txt](./migration_list_reference.txt), 확인 스크립트 [scripts/check_via_cli.ps1](./scripts/check_via_cli.ps1)

---

## 1. 현재 마이그레이션 구조 (분석 요약)

| 순서 | 파일 | 적용 내용 |
|------|------|-----------|
| 1 | `001_schema.sql` | 테이블: groups, boards, group_members, posts, comments, reactions, app_admin. 인덱스, CHECK, updated_at 트리거, 소프트 삭제, posts_with_like_count 뷰, 스팸 제한, cleanup_orphan_group_members 함수 |
| 2 | `002_rls.sql` | RLS: posts, comments, reactions, boards, groups, group_members, app_admin (읽기/쓰기/삭제 조건) |
| 3 | `003_grants.sql` | anon/authenticated에 public 스키마 테이블·시퀀스 권한, posts_with_like_count SELECT |
| 4 | `009_post_analysis.sql` | post_analysis 테이블, posts_with_like_count 뷰 재정의(emotions 포함) |
| 5 | `010_image_attachment.sql` | posts.image_url 컬럼 추가 |
| 6 | `011_emotion_trend_rpc.sql` | get_emotion_trend(days) RPC 함수 |
| 7 | `012_group_delete_rls.sql` | groups DELETE RLS(본인 소유+app_admin), posts/comments board_id ON DELETE CASCADE |

**의존 관계**: 002는 001 이후, 003은 002 이후(뷰 필요), 009는 001·002 이후, 011은 009 이후, 012는 001·002 이후.

---

## 2. 적용 전 확인 (현재 DB 상태 파악)

### A. CLI 사용 시 (권장)

- `supabase migration list`로 Local vs Remote 비교.  
- 적용이 안 된 번호가 있으면 `supabase db push` 한 번으로 해당 마이그레이션만 순서대로 적용됩니다.

### B. SQL Editor 사용 시 (CLI 없이 확인할 때)

Supabase 대시보드 **SQL Editor**에서 아래 파일의 쿼리를 실행해, 이미 적용된 항목을 확인할 수 있습니다.

- **[check_applied.sql](./check_applied.sql)** 실행 → 테이블·뷰·정책·함수 존재 여부 출력.

이미 있는 객체는 해당 마이그레이션을 **건너뛰고**, 없는 것만 [APPLY_ORDER.txt](./APPLY_ORDER.txt) 순서대로 적용하면 됩니다.

---

## 3. 적용 방법

### 방법 A: Supabase CLI (연결된 프로젝트에 적용 — 현재 DB에 맞게 자동 적용)

```bash
# 프로젝트 루트에서
supabase link --project-ref <프로젝트-ref>
supabase migration list   # 적용 여부 확인 (선택)
supabase db push
```

- `db push`는 `migrations/` 안의 마이그레이션을 **번호 순서**로 적용합니다. **이미 원격에 적용된 것은 건너뛰고**, 아직 없는 것만 적용하므로 현재 DB 상태에 맞게 동작합니다.
- 이 저장소에 있는 001, 002, 003, 009, 010, 011, 012만 적용 대상입니다 (004~008은 로컬에 없음).

### 방법 B: 수동 적용 (SQL Editor에서 파일 내용 복사)

CLI를 쓰지 않을 때는 아래 **순서**대로 SQL Editor에서 실행합니다.

1. `migrations/001_schema.sql` 전체 실행  
2. `migrations/002_rls.sql` 전체 실행  
3. `migrations/003_grants.sql` 전체 실행  
4. `migrations/009_post_analysis.sql` 전체 실행  
5. `migrations/010_image_attachment.sql` 전체 실행  
6. `migrations/011_emotion_trend_rpc.sql` 전체 실행  
7. `migrations/012_group_delete_rls.sql` 전체 실행  

- 001·002·003이 이미 적용된 DB라면 **4번부터** 진행하면 됩니다.
- 009까지 적용된 DB라면 **5번(010)부터** 진행하면 됩니다.

---

## 4. 적용 후 수동 설정 (선택)

- **관리자 등록**: [migrations/README.md](../migrations/README.md) 참고.
- **기본 공개 게시판**: 동일 문서의 `INSERT INTO boards ...` 참고.
- **Realtime**: Database > Replication에서 `posts`, `comments`, `reactions` 활성화.

---

## 5. 요약

- **현재 DB 확인**: CLI `supabase migration list` 또는 SQL Editor에서 `check_applied.sql` 실행.
- **적용 순서**: 001 → 002 → 003 → 009 → 010 → 011 → 012 (이 repo에 있는 파일만).
- **적용 방법**: CLI 사용 시 `supabase db push`(이미 적용된 건 자동 건너뜀). 수동 시 [APPLY_ORDER.txt](./APPLY_ORDER.txt) 순서대로 각 SQL 파일 실행.

---

## 6. 문제 해결

### "Remote migration versions not found in local migrations directory"

원격 DB 마이그레이션 이력에 **004, 005, 006, 007, 008** 같은 번호가 있는데 로컬 `migrations/` 에는 해당 파일이 없을 때 발생합니다. 이 경우 원격 이력만 정리하면 됩니다.

```bash
# 원격 이력에서 004~008을 'reverted'로 표시 (로컬에 없는 마이그레이션)
supabase migration repair --status reverted 004 005 006 007 008
```

이후 `npm run db:push` 또는 `supabase db push`를 다시 실행하면, 로컬에 있는 001, 002, 003, 009, 010, 011, 012만 기준으로 동기화됩니다.
