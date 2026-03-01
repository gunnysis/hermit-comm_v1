# Supabase CLI로 원격 DB 마이그레이션 적용 여부 확인
# 프로젝트 루트에서 실행: .\supabase\apply-to-existing-db\scripts\check_via_cli.ps1
# 전제: supabase link 완료

Set-Location $PSScriptRoot\..\..\..
Write-Host "Running: supabase migration list" -ForegroundColor Cyan
Write-Host ""
supabase migration list 2>&1
Write-Host ""
Write-Host "기대 목록: 001, 002, 003, 009~023, 20260223110128, 20260301000000" -ForegroundColor Yellow
Write-Host "Local에만 있고 Remote에 없는 항목이 있으면: supabase db push" -ForegroundColor Yellow
