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

## 문제 해결

- **Metro/번들 오류**: `npx expo start --clear`
- **의존성 충돌**: 위 "캐시 / 의존성" 절차 후 `npm install`
- **Supabase 연결 실패**: `.env`의 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` 확인
- **스플래시/아이콘 변경 후 화면에 안 나올 때**: 스플래시·앱 아이콘은 **prebuild 시점**에 네이티브 에셋으로 생성됩니다. `app.config.js`와 `assets/`만 바꿨다면 **새로 빌드**해야 반영됩니다.
  - 로컬에서 네이티브 폴더 쓸 때: `npx expo prebuild --clean` 후 `npx expo run:android` 또는 `run:ios`로 재빌드·재설치.
  - EAS Build만 쓸 때: 스플래시/아이콘 수정 후 **새 프로필로 한 번 더 빌드** (예: `eas build --profile preview --platform android`)하고, 나온 APK/IPA를 다시 설치하면 새 스플래시가 적용됩니다.
