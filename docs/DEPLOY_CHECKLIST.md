# 프로덕션 배포 체크리스트

은둔마을 앱을 프로덕션으로 배포하기 전에 확인할 항목입니다.

---

## 1. 환경 변수 / 시크릿

- **Supabase**  
  `eas.json`의 production 프로필에는 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`를 **저장하지 않습니다**.  
  EAS Build 시 다음 시크릿을 설정하세요.

  ```bash
  eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_PROJECT.supabase.co" --scope project
  eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY" --scope project
  ```
  eas 환경변수 데이터를 .env 파일로 관리 및 저장
  ```eas secret:push --scope project --env-file .env```

  또는 EAS 대시보드 → 프로젝트 → Secrets에서 동일한 이름으로 등록합니다.

등록이 잘 되었는지 확인하려면 다음 명령어를 사용하세요:

  ```bash
  eas secret:list
  ```

- **Sentry (선택)**  
  프로덕션에서 `logger.error` 및 `AppErrorBoundary` 예외가 Sentry로 전송되도록 하려면  
  `EXPO_PUBLIC_SENTRY_DSN`을 EAS Secrets에 설정하세요.  
  앱에서는 `environment`(EAS 빌드 프로필/APP_ENV), `release`(앱 버전)를 자동 전송하며, 이메일·본문 등 PII는 beforeSend에서 제거됩니다.  
  빌드 시 소스맵 업로드와 “Missing config for organization, project” 경고 제거를 위해  
  EAS Secrets 또는 로컬 env에 `SENTRY_ORG`, `SENTRY_PROJECT`(및 필요 시 `SENTRY_AUTH_TOKEN`)를 설정할 수 있습니다.  
  미설정 시 로그 전송은 건너뛰며 앱 동작에는 영향 없습니다.  
  **프로덕션 빌드**: `eas.json`에 `SENTRY_DISABLE_AUTO_UPLOAD: "true"`가 설정되어 있어 Sentry 미설정 시에도 Android 빌드가 실패하지 않습니다.  
**소스맵 사용 시** EAS Secrets 4개 설정: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `SENTRY_DISABLE_AUTO_UPLOAD=false`. 상세는 [docs/SENTRY.md](SENTRY.md) 참고.

---

## 2. 배포 전 검사

다음 명령이 모두 통과하는지 확인합니다.

```bash
npx tsc --noEmit
npm test
npm run lint
```

- **디버그 코드**: 프로덕션 빌드에 디버그 전용 로깅·개발 서버 URL·테스트용 분기가 포함되지 않았는지 확인합니다.

E2E(선택):

```bash
npm run test:e2e
# 관리자 시나리오: MAESTRO_ADMIN_EMAIL, MAESTRO_ADMIN_PASSWORD (.env)
npm run test:e2e:admin
```

- **E2E 추천**: `MAESTRO_ADMIN_*`는 실제 운영자 계정이 아닌 **E2E 전용 관리자 계정** 하나를 `app_admin`에 등록해 사용하세요. 가능하면 스테이징/테스트 전용 Supabase 프로젝트를 두고 E2E는 그 프로젝트 URL·키를 쓰도록 하면 프로덕션 DB를 건드리지 않습니다.

---

## 3. EAS 빌드

- **프로덕션 빌드**  
  네이티브 의존성 변경(예: TenTap, react-native-webview)이 있으면  
  새 프로덕션 빌드 후 스토어 제출이 필요합니다. OTA는 JS 번들만 갱신합니다.

  ```bash
  eas build --platform android --profile production
  # 또는
  eas build --platform all --profile production --auto-submit
  ```

- **제출**  
  `eas.json`의 `submit.production.android`에 `serviceAccountKeyPath`가 설정되어 있으면  
  `--auto-submit` 또는 `eas submit`으로 Play Console에 제출할 수 있습니다.  
  서비스 계정 JSON 키 파일은 저장소에 커밋하지 말고, 로컬 `.key/` 또는 CI 시크릿으로만 관리하세요.

---

## 4. Supabase / 백엔드

- **마이그레이션**  
  `supabase/migrations/`를 **번호 순서대로** 프로덕션 DB에 적용합니다.  
  (001_schema → 002_rls → 003_grants → 009~012. 상세는 `supabase/migrations/README.md` 참고.)  
  로컬: `supabase db push` 또는 대시보드에서 SQL 실행.

- **RLS**  
  글/댓글 읽기·쓰기 정책이 의도대로 동작하는지(공개 보드, 그룹 멤버십, 관리자) 확인합니다.

- **Realtime**  
  게시글·댓글·반응 실시간 구독이 프로덕션 Supabase 프로젝트에서 활성화되어 있는지 확인합니다.

---

## 5. 스토어 제출 후

- **OTA 업데이트**  
  JS/에셋만 변경된 경우:  
  `npm run update:production` (또는 `eas update --branch production --message "..."`)  
  으로 프로덕션 채널에 OTA를 푸시할 수 있습니다.

- **버전**  
  `app.config.js` / `app.json`의 `version`과 `android.versionCode`(또는 `ios.buildNumber`)가  
  스토어에 제출하는 빌드와 맞는지 확인합니다.

---

## 6. 요약

| 항목 | 확인 |
|------|------|
| EAS Secrets에 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` 설정 | ☐ |
| `tsc` / `npm test` / `npm run lint` 통과 | ☐ |
| 디버그/개발 전용 코드 제거 여부 확인 | ☐ |
| 프로덕션 Supabase 마이그레이션 적용(001→002→003→009~012) | ☐ |
| (선택) Sentry DSN 설정 | ☐ |
| (선택) 서비스 계정 키로 Play 제출 설정 | ☐ |
| 버전/빌드 번호 확인 | ☐ |
