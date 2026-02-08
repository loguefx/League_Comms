# PowerShell script to reset migrations when switching from SQLite to PostgreSQL
# Usage: .\scripts\reset-migrations-for-postgres.ps1

Write-Host "🔄 Resetting Prisma migrations for PostgreSQL..." -ForegroundColor Cyan

$apiPath = Join-Path $PSScriptRoot ".." "apps" "api"
Set-Location $apiPath

# Check if migrations directory exists
$migrationsPath = Join-Path "prisma" "migrations"
if (Test-Path $migrationsPath) {
    Write-Host "📁 Found existing migrations directory" -ForegroundColor Yellow
    Write-Host "🗑️  Removing old SQLite migrations..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $migrationsPath
    Write-Host "✅ Removed old migrations" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No existing migrations directory found" -ForegroundColor Gray
}

# Check if migration_lock.toml exists
$lockPath = Join-Path "prisma" "migration_lock.toml"
if (Test-Path $lockPath) {
    Write-Host "🗑️  Removing old migration_lock.toml..." -ForegroundColor Yellow
    Remove-Item -Force $lockPath
    Write-Host "✅ Removed migration_lock.toml" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No migration_lock.toml found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Migration directory reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Make sure PostgreSQL is running and DATABASE_URL is correct"
Write-Host "   2. Run: npm run prisma:migrate"
Write-Host "   3. This will create a new migration history for PostgreSQL"
