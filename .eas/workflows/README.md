# EAS Workflows

이 디렉터리의 YAML 파일은 [EAS Workflows](https://docs.expo.dev/eas/workflows/introduction/)로, GitHub 이벤트 또는 수동 실행 시 EAS에서 빌드·업데이트·제출을 자동화합니다.

## 사전 요건

1. **GitHub 저장소 연결**  
   [Expo Dashboard](https://expo.dev) → 프로젝트 → **GitHub**에서 저장소를 연결하고 Expo GitHub App을 설치합니다.

2. **EAS 환경 변수**  
   빌드/업데이트에 필요한 값(예: `EXPO_PUBLIC_*`)은 [EAS Environment Variables](https://docs.expo.dev/eas/environment-variables/)에서 프로젝트별로 설정합니다.

## 워크플로 요약

| 파일 | 트리거 | 설명 |
|------|--------|------|
| `build-preview.yml` | main 제외 브랜치 push / 수동 | Preview 프로필로 Android·iOS 빌드 (내부 테스트) |
| `build-production.yml` | main push / 수동 | Production 프로필로 Android·iOS 빌드 |
| `publish-update-preview.yml` | main 제외 브랜치 push / 수동 | Preview 채널로 OTA 업데이트 배포 |
| `publish-update-production.yml` | main push / 수동 | Production 채널로 OTA 업데이트 배포 |
| `build-and-submit-production.yml` | 수동만 | Production 빌드 후 App Store / Play Store 제출 |

## 수동 실행

```bash
# Preview 빌드
eas workflow:run .eas/workflows/build-preview.yml

# Production 업데이트 배포
eas workflow:run .eas/workflows/publish-update-production.yml

# 빌드 후 스토어 제출 (수동)
eas workflow:run .eas/workflows/build-and-submit-production.yml
```

## 참고

- [EAS Workflows 문서](https://docs.expo.dev/eas/workflows/introduction/)
- [워크플로 문법](https://docs.expo.dev/eas/workflows/syntax/)
- [GitHub 연동](https://docs.expo.dev/eas/workflows/automating-eas-cli/#configure-your-project)
