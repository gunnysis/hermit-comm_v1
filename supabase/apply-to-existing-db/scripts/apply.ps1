# 현재 연결된 Supabase 원격 DB에 migrations/ 적용
# 프로젝트 루트에서 실행: .\supabase\apply-to-existing-db\scripts\apply.ps1
# 전제: supabase link 완료

$root = Resolve-Path "$PSScriptRoot\..\..\"
Set-Location $root

Write-Host "Applying migrations to linked Supabase DB..." -ForegroundColor Cyan
Write-Host ""

$err = $null
supabase db push 2>&1 | Tee-Object -Variable output | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Push failed. Ensure: supabase link --project-ref <ref>" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done. Run 'npm run db:migration-list' to verify." -ForegroundColor Green
