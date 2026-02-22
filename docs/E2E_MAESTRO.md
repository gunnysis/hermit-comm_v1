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

- **Android 에뮬레이터 또는 실제 기기**에서 앱이 실행 중이어야 합니다.
  - `npm run android` 로 앱 빌드·실행 후, Dev Client에서 앱 진입
- 관리자 시나리오를 돌릴 경우 `.env` 에 다음 설정:
  - `MAESTRO_ADMIN_EMAIL` — E2E용 관리자 이메일
  - `MAESTRO_ADMIN_PASSWORD` — E2E용 관리자 비밀번호  
  (실제 값은 `.env`에만 두고, 코드/저장소에는 넣지 않음)
- **키보드**: 에뮬레이터에 **한국어/영어 키보드**가 설정되어 있다고 가정합니다.
  - 시나리오에서 **영어 입력 직전**에 `common/ensure-english-keyboard.yaml`로 한/영(또는 ABC) 키를 탭해 영문 키보드로 전환합니다.
  - **한글 입력 직전**에 `common/ensure-korean-keyboard.yaml`로 한/영 키를 탭해 한글 키보드로 전환합니다.
  - 따라서 현재 키보드가 한글이든 영어든, 테스트가 자동으로 필요한 언어로 바꾼 뒤 입력합니다.

## 3. E2E 실행

프로젝트 루트에서:

```bash
# 전체 시나리오
npm run test:e2e

# 관리자 로그인 → 그룹 생성 → 로그아웃만
npm run test:e2e:admin

# 초대 코드 "테스트" 그룹 생성 후, 같은 코드로 참여 시나리오
npm run test:e2e:invite
```

시나리오 파일은 `.maestro/` 아래에 있으며, 상세는 `CLAUDE.md` 11절을 참고하세요.

**앱 로직과 테스트 설계**: 관리자 로그인 후 다시 "운영자 관리 페이지"를 탭하면 앱은 **로그인 화면이 아니라 관리자 페이지**로 이동합니다. E2E에서는 관리자 시나리오(admin-login, admin-create-group, admin-logout, admin-create-group-invite-test) 시작 시 **앱 재시작(launch-app-fresh)**으로 익명 세션을 보장해, "운영자 관리 페이지" 탭 후 항상 로그인 화면이 나오도록 설계되어 있습니다. 자세한 설계는 `.maestro/README_E2E_DESIGN.md`를 참고하세요.
