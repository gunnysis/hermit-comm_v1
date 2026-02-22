# Supabase 설정 (은둔마을)

## 디렉터리 구조

```
supabase/
├── config.toml          # 로컬/CLI 설정
├── migrations/           # DB 마이그레이션 (순서대로 적용)
│   ├── 001_schema.sql    # 통합 스키마
│   ├── 002_rls.sql       # RLS 정책
│   └── 003_grants.sql    # 권한 부여
└── README.md
```

## 초기 설정 (Init)

### 1. Supabase CLI 설치

```bash
# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 또는 npm
npm install -g supabase
```

### 2. 이미 설정된 경우

- `config.toml`이 있으면 **추가 init 불필요**
- 원격 프로젝트와 연결: `supabase link --project-ref <프로젝트-ref>`

### 3. 로컬에서 DB 실행 (선택)

```bash
supabase start
# 마이그레이션이 자동 적용됨

supabase stop   # 종료 시
```

## 마이그레이션 적용 방법

### A. 원격(호스팅) Supabase에 적용

1. **대시보드 SQL Editor**
   - [Supabase Dashboard](https://app.supabase.com) → 프로젝트 → SQL Editor
   - `001_schema.sql` 내용 붙여넣기 → Run
   - 그다음 `002_rls.sql` 실행
   - 그다음 `003_grants.sql` 실행

2. **CLI로 푸시 (연결 후)**

   ```bash
   supabase link --project-ref <프로젝트-ref>
   supabase db push
   ```

### B. 로컬 Supabase에 적용

```bash
supabase start
# migrations/ 폴더가 자동 적용됨
```

## 필수 대시보드 설정

1. **Authentication → Providers**  
   - **Anonymous Sign-in** 활성화

2. **Database → Replication**  
   - `posts`, `comments`, `reactions` 테이블 Realtime 활성화

## 마이그레이션 순서

| 파일 | 내용 |
|------|------|
| 001_schema.sql | groups, boards, group_members, posts, comments, reactions, app_admin, 인덱스·트리거·뷰·함수 |
| 002_rls.sql | RLS 정책 (auth.uid() 캐싱, 그룹 멤버십, 관리자 제한) |
| 003_grants.sql | anon/authenticated 권한 + posts_with_like_count SELECT |

자세한 요약은 [migrations/README.md](migrations/README.md)를 참고하세요.
