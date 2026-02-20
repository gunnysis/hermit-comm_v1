# 개발 치트시트 (은둔마을)

로컬 개발·빌드·테스트 시 자주 쓰는 명령어 모음.

---

## 실행

| 용도 | 명령어 |
|------|--------|
| 개발 서버 | `npx expo start` |
| Android 에뮬레이터 | `npx expo run:android` 또는 `npx expo start --android` |
| iOS 시뮬레이터 | `npx expo start --ios` |
| 캐시 클리어 후 실행 | `npx expo start --clear` |
| 정적 export (웹) | `npx expo export -c` |

---

## 캐시 / 의존성

- 루트 **`.npmrc`**에 `legacy-peer-deps=true` 설정됨 (TenTap 등 peer 호환·EAS 빌드용). 변경하지 말 것.

```bash
# 캐시 + node_modules 초기화 후 재설치
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 검사 (테스트·타입·린트)

| 용도 | 명령어 |
|------|--------|
| 단위 테스트 | `npm test` |
| 테스트 감시 모드 | `npm run test:watch` |
| 타입 체크 | `npx tsc --noEmit` |

---

## EAS 빌드

| 용도 | 명령어 |
|------|--------|
| **개발용** (Development Client) | `eas build --platform android --profile development` |
| | `eas build --platform ios --profile development` |
| **외부 테스트용** (Preview, APK 등) | `eas build --platform ios --profile preview` |
| | `eas build --platform android --profile preview` |
| **스토어 배포** (버전 변경 후) | `eas build --platform all --profile production --auto-submit` |
| | `eas build --platform android --profile production --auto-submit` |

- Android 에뮬레이터에서 실행 전: 해당 프로필로 빌드한 APK/IPA 설치 필요.
- `--auto-submit`: 스토어 제출까지 수행 (submit 설정이 있을 때).

**OTA vs Production 빌드**: JS/리소스만 바꾼 경우는 **OTA** (`npm run update:production` 또는 워크플로우 "Publish Update (Production)")로 배포. **네이티브 의존성 추가/변경**(예: TenTap, react-native-webview)이 있으면 **Production 빌드 후 스토어 제출**이 필요합니다. OTA는 기존 앱에 새 네이티브 모듈을 넣지 않습니다.

---

## Supabase

- 마이그레이션 순서·실행: [`supabase/README.md`](supabase/README.md) 참고.
- 로컬 Supabase: `supabase start` → 마이그레이션 자동 적용.

---

## Git

```bash
# 새 브랜치
git checkout -b [브랜치명]
```

---

## 앱 테스트 (Android 에뮬레이터)

1. **에뮬레이터 실행**  
   Android Studio에서 AVD 실행하거나 터미널에서:
   ```bash
   %LOCALAPPDATA%\Android\Sdk\emulator\emulator -avd Galaxy_S25_Ultra
   ```
   (에뮬레이터가 완전히 부팅될 때까지 기다린 뒤 다음 단계 진행.)

2. **서명 불일치로 설치 실패할 때**  
   `INSTALL_FAILED_UPDATE_INCOMPATIBLE: signatures do not match` 가 나오면, 기존 앱을 제거한 뒤 다시 설치:
   ```bash
   adb uninstall com.gns.hermitcomm.dev
   ```

3. **앱 빌드·설치·실행**
   ```bash
   npm run android
   ```

---

## 본문·에디터 디버깅

글 보기/작성 관련 이슈 추적 시 참고.

1. **허용·무시 태그**  
   본문은 `src/features/posts/components/PostBody.tsx`의 `IGNORED_DOM_TAGS`로 제어됩니다.  
   - **무시**(렌더 안 함): `script`, `iframe`, `object`, `embed`, `form`, `input`, `button`, `style`, `link`, `meta`, `head`, `title`, `svg`  
   - **허용**: `p`, `strong`, `em`, `u`, `s`, `blockquote`, `ul`, `ol`, `li`, `br`, `code`, `pre`, `h2`, `h3`, `span`, `a`, `img`  
   - 링크(`a`)는 **http/https**만 탭 시 열리고, 이미지(`img`)는 **http/https** `src`만 표시됩니다. 그 외 스킴은 차단되며 개발 시 콘솔에 로그가 남습니다.

2. **HTML이 plain 텍스트로 보일 때**  
   `src/shared/utils/html.ts`의 `isLikelyHtml()`이 `false`이면 HTML이 아닌 일반 텍스트로 렌더됩니다.  
   - 태그 패턴이 정규식 `/<(?:\w+|[\w-]+)[\s>]/`에 맞지 않으면(예: `< p >`처럼 태그명 주변에 공백) plain으로 처리될 수 있습니다.

3. **링크/이미지가 안 보이거나 안 열릴 때**  
   - **링크**: `href`가 `http://` 또는 `https://`로 시작하는지 확인. `javascript:`, `data:` 등은 의도적으로 열리지 않습니다.  
   - **이미지**: `src`가 `http://` 또는 `https://`인지 확인.  
   - 개발 빌드에서는 콘솔에서 `[PostBody] 링크 스킴 차단`, `[PostBody] 이미지 src 차단` 로그로 차단된 URL을 확인할 수 있습니다.

4. **개발 시 로그 키워드**  
   - `[PostBody]` — 본문 렌더 fallback, 링크/이미지 차단, RenderHTML 에러  
   - `[API]` — API 호출 실패  
   - `[Realtime]` — 실시간 구독 에러  

   로그는 `__DEV__`일 때만 출력됩니다 (`src/shared/utils/logger.ts`).

---

## 문제 해결

- **Metro/번들 오류**: `npx expo start --clear`
- **의존성 충돌**: 위 "캐시 / 의존성" 절차 후 `npm install`
- **Supabase 연결 실패**: `.env`의 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` 확인
- **스플래시/아이콘 변경 후 화면에 안 나올 때**: 스플래시·앱 아이콘은 **prebuild 시점**에 네이티브 에셋으로 생성됩니다. `app.config.js`와 `assets/`만 바꿨다면 **새로 빌드**해야 반영됩니다.
  - 로컬에서 네이티브 폴더 쓸 때: `npx expo prebuild --clean` 후 `npx expo run:android` 또는 `run:ios`로 재빌드·재설치.
  - EAS Build만 쓸 때: 스플래시/아이콘 수정 후 **새 프로필로 한 번 더 빌드** (예: `eas build --profile preview --platform android`)하고, 나온 APK/IPA를 다시 설치하면 새 스플래시가 적용됩니다.
