#!/usr/bin/env bash
# pre-build-check.sh — EAS Build 전 로컬에서 실행하여 빌드 실패를 사전 방지
# Usage: bash scripts/pre-build-check.sh
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'
FAIL=0

echo "=== EAS Pre-Build Check ==="
echo ""

# 1. Expo SDK 호환성
echo -n "1. Expo SDK 호환성... "
COMPAT=$(npx expo install --check 2>&1)
if echo "$COMPAT" | grep -q "Dependencies are up to date"; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAIL${NC}"
  echo "$COMPAT" | grep -E "expected version:|should be updated"
  FAIL=1
fi

# 2. TypeScript 컴파일
echo -n "2. TypeScript... "
if npx tsc --noEmit 2>&1 | tail -1 | grep -qE "error TS|error:"; then
  echo -e "${RED}FAIL${NC}"
  npx tsc --noEmit 2>&1 | grep "error" | head -5
  FAIL=1
else
  echo -e "${GREEN}OK${NC}"
fi

# 3. expo-doctor
echo -n "3. Expo Doctor... "
DOCTOR=$(npx expo-doctor 2>&1 || true)
DOCTOR_FAILS=$(echo "$DOCTOR" | grep -c "✖" || true)
if [ "$DOCTOR_FAILS" -gt 0 ]; then
  echo -e "${YELLOW}${DOCTOR_FAILS} warning(s)${NC}"
  echo "$DOCTOR" | grep "✖"
else
  echo -e "${GREEN}OK${NC}"
fi

# 4. 중앙 레포 sync 정합성 (supabase-hermit verify)
echo -n "4. 중앙 레포 sync... "
CENTRAL="/home/gunny/apps/supabase-hermit"
if [ -d "$CENTRAL" ] && [ -f "$CENTRAL/scripts/verify.sh" ]; then
  VERIFY=$(bash "$CENTRAL/scripts/verify.sh" 2>&1 || true)
  if echo "$VERIFY" | grep -qi "fail\|mismatch\|error"; then
    echo -e "${RED}FAIL${NC}"
    echo "$VERIFY" | grep -i "fail\|mismatch" | head -5
    FAIL=1
  else
    echo -e "${GREEN}OK${NC}"
  fi
else
  echo -e "${YELLOW}SKIP (중앙 레포 없음)${NC}"
fi

# 5. 테스트
echo -n "5. 테스트... "
if npx jest --ci --passWithNoTests --silent 2>&1 | tail -1 | grep -q "Tests:.*passed"; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAIL${NC}"
  FAIL=1
fi

echo ""
if [ "$FAIL" -eq 1 ]; then
  echo -e "${RED}=== Pre-build check FAILED ===${NC}"
  echo "위 문제를 해결한 후 빌드하세요."
  exit 1
else
  echo -e "${GREEN}=== All checks passed ===${NC}"
  echo "EAS Build를 진행해도 안전합니다."
fi
