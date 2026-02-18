# 은둔마을 로드맵

추가 기능 및 개선사항을 단기·중기·장기로 나누어 정리했습니다.  
이슈 트래커(GitHub Issues 등)와 연동할 때 `#이슈번호` 형태로 연결하면 됩니다.

---

## 완료된 항목 (Quick Wins)

- [x] **게시글/댓글 수정** — RLS `update` 정책, `api.updatePost`/`api.updateComment`, 수정 화면·인라인 수정 UI
- [x] **목록에 댓글 수 표시** — `getPosts`에 `comments(count)`/뷰 `comment_count` 반영, `PostCard` 배지
- [x] **정렬 옵션** — 최신순/인기순 API 파라미터, 홈 화면 정렬 탭
- [x] **탭 네비게이션 접근성** — `tabBarAccessibilityLabel`, `tabBarAccessibilityHint` 적용
- [x] **ROADMAP.md** — 본 문서

---

## 단기 (다음 스프린트)

| # | 카테고리 | 항목 | 설명 |
|---|----------|------|------|
| | UX | 무한 스크롤/더 보기 정리 | 목록 스크롤 끝에서 자동 로드 또는 "더 보기" 버튼 명확화 |
| | UX | 게시글 검색 | 제목/내용 기준 검색( Supabase `ilike` 또는 FTS ), 검색 화면 또는 홈 상단 검색창 |
| | 반응 | 반응 실시간 동기화 | Realtime으로 `reactions` 구독, 상세 화면에서 즉시 반영 |
| | 네비게이션 | 딥링크 | `post/[id]` 공유 시 앱에서 해당 게시글 직접 열기 |
| | 접근성 | 스크린 리더/포커스 | 주요 버튼·입력란에 `accessibilityLabel`, `accessibilityHint` 보강 |

---

## 중기

| # | 카테고리 | 항목 | 설명 |
|---|----------|------|------|
| | 반응 | 다중 반응 타입 | 이모지 선택(👍❤️😂 등) 및 타입별 집계 표시 |
| | 스키마 | 소프트 삭제 | `deleted_at` 컬럼 + RLS로 숨기기, 복구·관리 확장 |
| | 스키마 | 이미지 첨부 | `posts` 또는 `post_attachments` + Storage RLS·업로드 API |
| | API | Rate limiting | Edge Function 또는 DB 트리거로 생성/삭제 빈도 제한 |
| | API | 입력 검증(서버) | 제목/내용 길이·금칙어 등 DB 제약 또는 Function |
| | 보안 | 익명 사용자 생성 제한 | 일일 게시글/댓글 상한(트리거 또는 Edge Function) |
| | 보안 | 로그 민감 정보 마스킹 | `author_id` 등 로그 노출 최소화 |
| | 성능 | 목록 가상화 | `FlashList` 또는 `FlatList` `windowSize` 조정 |
| | 성능 | 에러 재시도 | React Query에서 일시적 오류 시 재시도 및 사용자 안내 |

---

## 장기

| # | 카테고리 | 항목 | 설명 |
|---|----------|------|------|
| | 성능 | 오프라인 대응 | 읽기 캐시(AsyncStorage/MMKV) + 재연결 시 재조회 |
| | 문서 | API 타입 동기화 | `supabase gen types typescript`로 DB 타입 자동 생성 |
| | 테스트 | E2E | Detox 또는 Maestro로 목록 → 상세 → 댓글 작성 플로우 자동화 |
| | 테스트 | 훅/API 목 테스트 | `useRealtimePosts` 등 Supabase 목 단위 테스트 |
| | CI/CD | PR 시 검사 | GitHub Actions에서 `tsc`, `npm test`, `expo lint` 실행 |
| | 모니터링 | 에러 리포팅 | Sentry 등 프로덕션 오류 수집 |

---

## 이슈 연결 방법

- 위 표의 빈 `#` 칸에 이슈 번호를 적으면 됩니다 (예: `#12`).
- 이슈 제목은 "항목" 열과 동일하게 두거나, 상세 설명을 부제로 넣으면 됩니다.
