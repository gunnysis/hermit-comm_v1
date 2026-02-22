# E2E 테스트 설계 (앱 로직 분석 기반)

E2E 시나리오는 **앱의 실제 로직과 프로세스를 먼저 분석한 뒤** 그에 맞춰 설계한다. 분석 없이 화면만 기준으로 하면 세션 복원·분기 등으로 시행착오가 발생한다.

---

## 1. 앱 로직 분석

### 1.1 인증·세션

- **기본**: Supabase Auth. 앱 시작 시 `useAuth`/`auth`에서 `supabase.auth.getSession()`으로 **기존 세션을 먼저 확인**한다.
- **세션 유지**: Supabase가 디바이스(AsyncStorage 등)에 세션을 저장하므로, **앱을 재시작(stopApp + launchApp)해도 세션이 복원**된다. 이전에 이메일 로그인한 관리자라면 재시작 후에도 `user`·`isAdmin`이 true로 유지된다.
- **익명**: 세션이 없을 때만 `signInAnonymously()`로 익명 로그인한다.
- **관리자 판별**: `app_admin` 테이블 조회(`useIsAdmin`). 이메일 로그인한 사용자만 관리자일 수 있다.

### 1.2 설정 → 관리자 진입

- **설정** 화면의 "운영자 관리 페이지" 탭 → **항상** `router.push('/admin/login')` 호출. (설정 화면 자체는 현재 사용자 상태에 따라 분기하지 않음.)

### 1.3 /admin/login 도달 시 (admin/_layout.tsx, login.tsx)

| 조건 | 동작 |
|------|------|
| `user` 있음 + `isAdmin === true` + 로딩 완료 | **즉시 `router.replace('/admin')`** → 로그인 화면을 렌더하지 않고 **관리자 페이지(그룹 게시판 생성)**로 이동 |
| 그 외 (익명 또는 비관리자) | **로그인 화면** 표시 ("관리자 로그인", 이메일/비밀번호 입력) |

따라서 **이미 로그인한 관리자**가 "운영자 관리 페이지"를 탭하면 로그인 화면이 아니라 **관리자 페이지로 바로 이동**하는 것이 정상 동작이다. E2E에서 "관리자 로그인" 화면을 기대하려면, 해당 시나리오 시작 시점에 **익명 세션**이어야 한다.

### 1.4 관리자 페이지 (admin/index.tsx)

- **그룹 게시판 생성** 폼: 그룹명, 초대 코드, 설명(선택) 입력 후 "그룹 생성" 버튼.
- **동작**: `createGroupWithBoard`(adminApi) 호출 → 그룹·기본 보드·group_members(owner) 생성. 성공 시 `Alert.alert('그룹 생성 완료', ...)` 후 "내가 만든 그룹" 목록 쿼리 무효화로 새 그룹이 목록에 반영된다.
- **그룹 관리자 기능**은 이 **로그인 → 관리자 페이지 진입 → 그룹 생성 실행 → 생성 완료·목록 노출**까지가 한 흐름이다. E2E에서 그룹 관리자 테스트는 **그룹이 실제로 생성되는 것까지** 검증해야 한다.

### 1.5 홈에서의 관리자 진입

- **이미 관리자로 판별된 경우**에만 홈 헤더에 "관리자" 버튼 노출. "관리자" 탭 → `router.push('/admin')` → 로그인 없이 관리자 페이지로 이동.

---

## 2. E2E 설계 원칙 (앱 로직에 기반)

### 2.1 관리자·로그인 시나리오

- **목적**: "설정 → 운영자 관리 페이지 → 로그인 화면 → 로그인 → 관리자 페이지" 경로 검증.
- **전제**: 위 경로에서 로그인 화면이 나오려면 **익명 세션**이어야 한다. 세션이 복원되어 이미 관리자면 "운영자 관리 페이지" 탭 후 로그인 화면이 아닌 관리자 페이지로 바로 이동하므로, "관리자 로그인"을 기대하는 스텝이 실패한다.
- **설계**:
  1. 관리자 시나리오(admin-login, admin-create-group, admin-logout, admin-create-group-invite-test)는 **시작 시 익명 세션 보장**이 필요하다.
  2. **stopApp + launchApp**만으로는 세션이 복원되므로 부족하다. **관리자 플로우 실행 직전에 앱 데이터 초기화**(`adb shell pm clear <appId>`)를 기본 적용해 익명 세션을 만든다.
  3. 그 다음 launch-app-fresh(재시작) + 설정 → "운영자 관리 페이지" → 로그인 화면 기대 → 로그인 → 관리자 페이지 검증.

### 2.2 그룹 관리자 기능 테스트 (그룹 생성까지 포함)

- **그룹 관리자 기능** 테스트는 **그룹이 실제로 생성되는 것까지** 포함해야 한다.
- **admin-create-group**: 로그인 → 관리자 페이지 → 그룹명·초대 코드·설명 입력 → "그룹 생성" 탭 → "그룹 생성 완료" Alert 확인 → "확인" 탭 → "내가 만든 그룹" 목록에 생성된 그룹명("E2E 테스트 그룹") 노출 검증.
- **admin-create-group-invite-test**: 동일 흐름으로 초대 코드 "테스트"인 그룹("E2E 초대테스트") 생성 → "그룹 생성 완료" → "내가 만든 그룹" 목록에 "E2E 초대테스트" 노출 검증. (groups-join-by-invite의 사전 조건이 됨.)

### 2.3 공통 플로우 역할

| 플로우 | 용도 |
|--------|------|
| `common/launch-app.yaml` | 앱 포그라운드(launchApp) + 홈 대기. **세션 유지**. app-launch, groups-join-by-invite 등에 사용. |
| `common/launch-app-fresh.yaml` | **stopApp + launchApp** + 홈 대기. 앱 데이터 초기화와 함께 사용할 때 익명 세션 보장. 관리자 로그인/그룹 생성/로그아웃/초대코드 테스트에 사용. |

### 2.4 시나리오별 진입점·검증 범위

| 시나리오 | 시작 | "운영자 관리 페이지" 탭 후 기대 | 검증 범위 |
|----------|------|----------------------------------|------------|
| app-launch | launch-app (세션 유지) | - | 앱 기동·홈 노출 |
| admin-login | launch-app-fresh + 앱 데이터 초기화 | 관리자 로그인 화면 | 로그인 → 관리자 페이지 진입 |
| admin-create-group | 동일 | 관리자 로그인 화면 | 로그인 → **그룹 생성** → "그룹 생성 완료"·목록에 "E2E 테스트 그룹" |
| admin-logout | 동일 | 관리자 로그인 화면 | 로그인 → 로그아웃 → 탭 화면 복귀 |
| admin-create-group-invite-test | 동일 | 관리자 로그인 화면 | 로그인 → **그룹 생성(초대코드 "테스트")** → "그룹 생성 완료"·목록에 "E2E 초대테스트" |
| groups-join-by-invite | launch-app (세션 유지) | - | 그룹 탭 → 초대 코드 "테스트" 입력 → 참여 → "E2E 초대테스트" 노출 |
| e2e-cleanup | launch-app (세션 유지) | 관리자 로그인 화면 | 설정 → 로그인 → "내가 만든 그룹"에서 E2E Test Group·E2E Invite Test 삭제 → "아직 생성한 그룹이 없습니다" 확인 |

---

## 3. 실행 방식 및 순서

- **실행 전 작업**: E2E 실행 직전에 **앱 실행**, 필요 시 **관리자 로그아웃**, **앱 실행 후 팝업 종료**(Dev Client 서버 선택·Continue, OTA 알림 등)를 완료해 두어야 한다. 체크리스트는 [docs/E2E_MAESTRO.md](docs/E2E_MAESTRO.md) 2.1절 참고.
- **순차 실행**: `npm run test:e2e` 등은 `scripts/run-maestro.js`로 **플로우를 한 개씩 순서대로** 실행한다. 병렬 실행 시 stopApp/launchApp 충돌·세션 간섭을 피하기 위함이다.
- **고정 실행 순서** (test:e2e):  
  app-launch → admin-login → admin-create-group → admin-logout → admin-create-group-invite-test → groups-join-by-invite → **e2e-cleanup**
- **의존 관계**: groups-join-by-invite는 초대 코드 "TESTCODE"인 그룹이 있어야 하므로 **반드시 admin-create-group-invite-test 다음에** 실행된다. **e2e-cleanup**은 전체 E2E에서 생성한 그룹(E2E Test Group, E2E Invite Test)을 삭제하므로 **맨 마지막**에 실행된다.
- **입력 문자**: Maestro는 유니코드(한글) 입력을 지원하지 않음. 그룹명·초대코드·설명 등 `inputText`는 모두 ASCII 사용 (예: E2E Test Group, E2E Invite Test, TESTCODE).
- **앱 데이터 초기화**: 관리자 플로우(admin-*) 실행 **직전**에 기본으로 `adb shell pm clear <appId>`를 실행해 익명 세션을 보장한다. 비활성화: `MAESTRO_CLEAR_APP_DATA=false`. (adb 필요)

---

## 4. 요약

- **앱**: 관리자 로그인 후 "운영자 관리 페이지"를 탭하면 로그인 페이지가 아니라 관리자 페이지로 가는 것이 정상이다. 세션은 재시작 후에도 복원된다.
- **E2E**: 앱 로직(세션 복원·/admin/login 분기·그룹 생성 흐름)을 반영해, 관리자 시나리오는 앱 데이터 초기화로 익명 세션을 보장한 뒤 로그인 → 관리자 페이지(및 그룹 생성)를 검증한다.
- **그룹 관리자 테스트**: admin-create-group, admin-create-group-invite-test는 **그룹 생성 실행 → "그룹 생성 완료" 확인 → "내가 만든 그룹" 목록에 생성된 그룹 노출**까지 검증한다.
