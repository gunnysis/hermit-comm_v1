# Sentry 설정 (은둔마을)

프로덕션에서 오류·예외를 Sentry로 수집하려면 아래 순서로 설정합니다. **선택 사항**이며, 미설정 시 앱은 정상 동작하고 오류 전송만 건너뜁니다.

**설정 체크리스트**

| 순서 | 작업 |
|------|------|
| 1 | Sentry 프로젝트 생성 → DSN 복사 (및 필요 시 org/project slug 확인) |
| 2 | `EXPO_PUBLIC_SENTRY_DSN`을 `.env`와 EAS Secret에 설정 |
| 3 | (선택) 소스맵 업로드: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `SENTRY_DISABLE_AUTO_UPLOAD=false` 를 EAS Secrets에 설정 |
| 4 | 프로덕션 빌드 실행 후 Sentry 대시보드에서 이벤트 수신 확인 |

**소스맵까지 사용 시**: 3단계까지 진행한 뒤, production/preview 빌드 시 위 4개 시크릿(`SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `SENTRY_DISABLE_AUTO_UPLOAD=false`)이 EAS Secrets에 설정되어 있어야 합니다.

**.env 적용 후**: 로컬 개발(`npx expo start`)에서는 `__DEV__`가 true라 Sentry가 초기화되지 않습니다. 프로덕션 빌드(`eas build --profile production`) 또는 EAS Secrets에 `EXPO_PUBLIC_SENTRY_DSN`을 넣은 뒤 빌드한 앱에서만 오류가 Sentry로 전송됩니다.

**프로젝트 적용 상태**: `_layout.tsx`(DSN·release·beforeSend), `app.config.js`(Sentry 플러그인·SENTRY_ORG/PROJECT), `eas.json`(SENTRY_DISABLE_AUTO_UPLOAD)가 이미 반영되어 있습니다. `.env`에 Sentry 값을 채우고, 프로덕션·소스맵 사용 시 EAS Secrets만 설정하면 됩니다.

**EAS 적용**: `.env`에 표준 이름(`EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `SENTRY_DISABLE_AUTO_UPLOAD`)으로 넣은 뒤, **EAS 적용**은 `eas secret:push --scope project --env-file .env` 한 번으로 완료할 수 있습니다.

---

## 1. Sentry 프로젝트 생성

1. [sentry.io](https://sentry.io)에 로그인 후 **Create Project** 선택.
2. 플랫폼 **React Native** 선택 후 프로젝트 이름(예: `gns-hermit-comm`) 입력.
3. 생성 후 **DSN**을 복사합니다. (Settings → Client Keys (DSN)에서도 확인 가능.)
4. (소스맵 업로드 사용 시) **Organization slug**와 **Project slug** 확인: Settings → Organization Settings / Project Settings에서 URL 또는 slug 필드 확인.

---

## 2. 앱에서 사용할 환경 변수 (런타임)

앱이 오류를 보낼 때 사용하는 DSN은 **클라이언트에 포함**되므로 **공개 DSN**만 사용합니다.

- **변수명**: `EXPO_PUBLIC_SENTRY_DSN`
- **설정 위치**  
  - 로컬/개발: `.env`에 추가 (저장소에 커밋하지 않음).  
  - EAS 프로덕션 빌드: EAS Secrets에 등록.

```bash
# EAS 시크릿으로 등록 (프로덕션 빌드·OTA 시 앱에 포함됨)
eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "https://xxxx@xxxx.ingest.sentry.io/xxxx" --scope project
```

`.env` 예시는 `.env.example`의 `EXPO_PUBLIC_SENTRY_DSN` 항목을 참고하세요.

---

## 3. 빌드 시 소스맵 업로드 (선택)

소스맵을 업로드하면 Sentry에서 **미니파이된 스택을 원본 파일/라인으로** 보여줍니다.

- **기본 동작**: `eas.json`의 production/preview 프로필에 `SENTRY_DISABLE_AUTO_UPLOAD: "true"`가 설정되어 있어, **Sentry를 쓰지 않아도 프로덕션 빌드가 실패하지 않습니다.**
- **Sentry 사용 시**: 아래 EAS Secrets를 설정한 뒤, **소스맵 업로드를 켜려면** `SENTRY_DISABLE_AUTO_UPLOAD`를 `false`로 덮어쓰세요.

| 시크릿 이름 | 설명 |
|-------------|------|
| `SENTRY_ORG` | Sentry 조직 슬러그 (Settings → Organization Settings → URL의 조직명) |
| `SENTRY_PROJECT` | 프로젝트 슬러그 (Settings → Project → 이름 옆 slug) |
| `SENTRY_AUTH_TOKEN` | [Account → Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)에서 생성 (project:releases, org:read 권한 권장) |
| `SENTRY_DISABLE_AUTO_UPLOAD` | 소스맵 업로드 사용 시 **`false`** 로 설정 (기본값은 eas.json의 `true`) |

예시 (소스맵 업로드 사용 시):

```bash
eas secret:create --name SENTRY_ORG --value "your-org-slug" --scope project
eas secret:create --name SENTRY_PROJECT --value "gns-hermit-comm" --scope project
eas secret:create --name SENTRY_AUTH_TOKEN --value "sntrys_xxx" --scope project
eas secret:create --name SENTRY_DISABLE_AUTO_UPLOAD --value "false" --scope project
```

`.env`로 한 번에 푸시할 경우, 해당 변수들을 `.env`에 넣은 뒤:

```bash
eas secret:push --scope project --env-file .env
```

---

## 4. 동작 확인

- **프로덕션 빌드**: `eas build --platform android --profile production` 실행. 소스맵 업로드를 켠 경우 빌드 로그에서 Sentry 업로드 단계가 정상 완료되는지 확인.
- **이벤트 수신**: 앱 설치 후 의도적으로 오류를 발생시키거나, Sentry 대시보드에서 해당 프로젝트로 이벤트가 들어오는지 확인.

---

## 5. 앱 내 동작 요약

- **초기화**: `src/app/_layout.tsx`에서 `!__DEV__ && EXPO_PUBLIC_SENTRY_DSN`일 때만 `Sentry.init()` 호출.
- **전송 대상**: `logger.error`, `AppErrorBoundary` 등에서 캡처된 예외. PII(이메일·본문 등)는 제거 후 전송.
- **release**: 앱 버전·빌드 번호가 자동으로 설정됩니다 (소스맵 업로드 시 동일 release로 매칭).

---

## 6. 문제 해결

- **빌드 실패: "An organization ID or slug is required"**  
  → Sentry 소스맵 업로드가 실행되었는데 `SENTRY_ORG`가 없을 때 발생.  
  → **해결 1**: Sentry를 쓰지 않는다면 `eas.json`에 `SENTRY_DISABLE_AUTO_UPLOAD: "true"`가 있는지 확인(이미 설정됨).  
  → **해결 2**: Sentry를 쓴다면 EAS Secrets에 `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`을 넣고, 소스맵 업로드를 쓰려면 `SENTRY_DISABLE_AUTO_UPLOAD=false`로 설정.

- **"Missing config for organization, project"**  
  → 빌드 시 Sentry 플러그인이 org/project를 찾지 못할 때. EAS Secrets에 `SENTRY_ORG`, `SENTRY_PROJECT` 설정.

- **프로덕션에서 오류가 Sentry에 안 보임**  
  → `EXPO_PUBLIC_SENTRY_DSN`이 프로덕션 빌드/OTA에 포함되었는지 확인. EAS Secrets에 등록했는지, 재빌드 또는 OTA 후 앱을 다시 실행했는지 확인.
