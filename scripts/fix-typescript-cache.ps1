# Fix TypeScript cache issues by rebuilding packages and clearing caches

Write-Host "🔧 Rebuilding @league-voice/riot package..." -ForegroundColor Cyan
Set-Location packages/riot
npm run build
Set-Location ../..

Write-Host "🔧 Rebuilding @league-voice/api package..." -ForegroundColor Cyan
Set-Location apps/api
npm run build
Set-Location ../..

Write-Host "✅ Done! TypeScript types should now be up to date." -ForegroundColor Green
