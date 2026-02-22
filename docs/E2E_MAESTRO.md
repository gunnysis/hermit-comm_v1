# E2E 테스트 (Maestro) 실행 방법

## 1. Maestro CLI 설치 (Windows)

현재 Maestro는 npm 패키지가 아니며, 별도 CLI 설치가 필요합니다.

### 방법 A: 공식 설치 스크립트 (Git Bash 또는 WSL)

1. [Git for Windows](https://git-scm.com/download/win) 등에서 **Git Bash** 실행
2. 아래 명령 실행 (Java 17+ 필요):

   ```bash
   curl -fsSL "https://get.maestro.mobile.dev" | bash
   ```

3. 새 터미널을 열고 `maestro --version` 으로 확인

### 방법 B: 수동 설치

1. [Maestro Releases](https://github.com/mobile-dev-inc/maestro/releases/latest) 에서 **maestro.zip** 다운로드
2. 원하는 폴더(예: `C:\maestro`)에 압축 해제  
   (PowerShell에서 zip이 안 풀리면 7-Zip 등으로 해제)
3. 압축 해제된 폴더 안의 `bin` 폴더를 PATH에 추가  
   예: `C:\maestro\bin` 을 시스템 환경 변수 PATH에 추가
4. 새 터미널에서 `maestro --version` 으로 확인

## 2. 실행 전 준비

### 2.1 E2E 실행 전 작업 (체크리스트)

테스트를 실행하기 **직전**에 아래를 확인하세요.

1. **앱 실행**
   - Android 에뮬레이터 또는 실제 기기에서 **앱이 이미 실행된 상태**여야 합니다.
   - `npm run android`로 빌드·실행 후, 앱이 메인 화면(탭 바가 보이는 상태)까지 떠 있어야 합니다.

2. **관리자 로그아웃 (상황에 따라)**
   - 이전에 앱에서 **관리자로 로그인한 상태**로 두었다면, E2E 전에 **관리자 페이지에서 로그아웃**해 두는 것이 좋습니다.
   - `npm run test:e2e` 전체 실행 시에는 관리자 플로우 직전에 **앱 데이터 초기화(adb pm clear)**가 기본으로 수행되므로, 수동 로그아웃이 필수는 아닙니다. 수동으로 앱만 켜 둔 뒤 `test:e2e:admin`만 돌리는 경우 등에는 로그아웃 후 실행하거나, 전체 `test:e2e`를 사용하세요.

3. **앱 실행 후 팝업·창 종료**
   - **Expo Dev Client** 사용 시: 서버 URL 선택 창이 뜨면 원하는 URL(예: `http://10.0.2.2:8081`) 선택 후 **Continue**를 수동으로 탭해 두고, 메인 앱(탭 바)이 보이도록 합니다. Maestro 플로우는 이 단계를 자동으로 수행하지 않습니다.
   - OTA 업데이트 안내 등 **팝업/알림**이 있으면 닫아 두고, **홈·그룹·설정** 탭이 보이는 메인 화면이 노출된 상태에서 `npm run test:e2e`를 실행하세요.

### 2.2 기타 준비

- 관리자 시나리오를 돌릴 경우 `.env` 에 다음 설정:
  - `MAESTRO_ADMIN_EMAIL` — E2E용 관리자 이메일
  - `MAESTRO_ADMIN_PASSWORD` — E2E용 관리자 비밀번호  
  (실제 값은 `.env`에만 두고, 코드/저장소에는 넣지 않음)
- **키보드**: 에뮬레이터에 **영어 키보드** 사용을 전제로 합니다. Maestro는 유니코드(한글) 입력을 지원하지 않으므로, 그룹명·초대코드 등은 모두 **ASCII**(예: E2E Test Group, TESTCODE)로 입력합니다. 영어 입력 직전에 `common/ensure-english-keyboard.yaml`로 영문 키보드로 전환합니다.

## 3. E2E 실행

프로젝트 루트에서:

```bash
# 전체 시나리오 (플로우를 순서대로 한 개씩 실행)
npm run test:e2e

# 실패한 플로우부터 재실행 (마지막 실패 시점부터 이어서 실행)
npm run test:e2e:resume

# 관리자 로그인 → 그룹 생성 → 로그아웃만 (순차 실행)
npm run test:e2e:admin

# 초대 코드 "TESTCODE" 그룹 생성 후, 같은 코드로 참여 시나리오 (순차 실행)
npm run test:e2e:invite
```

`test:e2e` / `test:e2e:admin` / `test:e2e:invite`는 `scripts/run-maestro.js`를 통해 **플로우를 순서대로 한 개씩** 실행합니다. 한 플로우가 실패하면 이후 플로우는 실행하지 않고 종료합니다.

**실패 시 재개**: `test:e2e` 실행 중 어느 플로우에서든 실패하면, 실패한 플로우 경로가 `.maestro/.e2e-last-failed`에 기록됩니다. 그다음 **`npm run test:e2e:resume`**을 실행하면 **실패한 그 플로우부터** 나머지 플로우만 순서대로 다시 실행합니다. 관리자 플로우부터 재개할 때도 재개 직전에 앱 데이터 초기화(adb pm clear)가 적용됩니다. 전체 플로우가 모두 성공하면 재개용 파일은 자동으로 삭제됩니다.

**테스트 그룹 삭제**: 성공 시에는 마지막 플로우인 e2e-cleanup이 테스트 그룹을 삭제합니다. **실패 시**에도 `run-maestro.js`는 종료 전에 e2e-cleanup을 한 번 실행해, 테스트로 생성된 그룹을 가능한 한 삭제한 뒤 종료합니다.

- **앱 데이터 초기화**: 관리자 플로우 직전에 **기본으로** 앱 데이터를 초기화(adb pm clear)하여 "관리자 로그인" 화면이 나오도록 합니다. 비활성화하려면 `MAESTRO_CLEAR_APP_DATA=false`로 실행하세요. (adb 필요)

시나리오 파일은 `.maestro/` 아래에 있으며, 상세는 `CLAUDE.md` 11절을 참고하세요.

**앱 로직과 테스트 설계**: 관리자 로그인 후 다시 "운영자 관리 페이지"를 탭하면 앱은 **로그인 화면이 아니라 관리자 페이지**로 이동합니다. E2E에서는 관리자 시나리오(admin-login, admin-create-group, admin-logout, admin-create-group-invite-test) 시작 시 **앱 재시작(launch-app-fresh)**으로 익명 세션을 보장해, "운영자 관리 페이지" 탭 후 항상 로그인 화면이 나오도록 설계되어 있습니다. 자세한 설계와 실행 순서는 `.maestro/README_E2E_DESIGN.md`를 참고하세요.

### 2.3 알려진 E2E 이슈 (배포 시 참고)

- **키보드**: `ensure-english-keyboard.yaml`에서 "한/영", "ABC" 버튼을 찾지 못하면 경고만 남기고 계속 진행합니다. 에뮬레이터가 이미 영문 키보드이면 무시해도 됩니다.
- **그룹 참여·완료 알림**: `groups-join-by-invite`에서 참여하기 탭 후 "완료" Alert이 15초 내에 보이지 않으면 실패할 수 있습니다. 네트워크·Supabase 지연 또는 초대 코드 불일치 시 재실행 또는 사전에 `admin-create-group-invite-test`로 TESTCODE 그룹 생성 여부를 확인하세요.
- **e2e-cleanup**: 전체 E2E가 순서대로 성공한 뒤에만 두 그룹이 모두 존재합니다. cleanup만 단독 실행하거나 중간 플로우 실패 후 재실행 시 그룹 0~1개라 타임아웃으로 실패할 수 있습니다.
