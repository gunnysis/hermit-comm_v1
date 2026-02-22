# 은둔마을 문서

프로젝트 문서 목록과 용도입니다.

| 문서 | 대상 | 내용 |
|------|------|------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | 개발자 | 기술 스택, 폴더 구조, 데이터 페칭 전략, API 레이어, 인증·익명 정책 |
| [APP_USAGE_GUIDE.md](APP_USAGE_GUIDE.md) | 사용자·운영자 | 앱 사용법(익명 게시판, 그룹, 관리자 로그인 등) |
| [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) | 배포 담당 | 프로덕션 배포 전 환경 변수, 검사(tsc/lint/test), EAS 빌드, Supabase·OTA 점검 |
| [E2E_MAESTRO.md](E2E_MAESTRO.md) | QA·개발자 | Maestro E2E 실행 방법, 실행 전 준비, 플로우 순서·재개 |
| [SENTRY.md](SENTRY.md) | 배포 담당 | Sentry 프로젝트 생성, DSN·EAS Secrets, 소스맵 업로드, 빌드 실패 해결 |
| [supabase_setup.md](supabase_setup.md) | 개발자·배포 담당 | Supabase 프로젝트 생성, 마이그레이션 적용, RLS, 관리자 설정 |
| [PROJECT_SETUP_PROPOSAL.md](PROJECT_SETUP_PROPOSAL.md) | 참고 | 기술 스택·폴더 구조 제안(대부분 반영됨), CI/CD·컨벤션 |

프로젝트 루트의 [architecture_v2_groups.md](../architecture_v2_groups.md), [ROADMAP.md](../ROADMAP.md), E2E 설계 상세는 `.maestro/README_E2E_DESIGN.md`를 참고할 수 있습니다.
