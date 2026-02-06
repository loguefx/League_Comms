# Windows Setup Script WITHOUT Docker
# This version uses local installations or alternatives

Write-Host "League Voice Companion - Windows Setup (No Docker)" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCheck) {
    $nodeVersion = node --version
    Write-Host "OK Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "ERROR: Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "OK Dependencies installed" -ForegroundColor Green

# Check if .env exists
Write-Host ""
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path "apps\api\.env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    if (Test-Path "apps\api\.env.example") {
        Copy-Item "apps\api\.env.example" "apps\api\.env"
        Write-Host "OK Created apps\api\.env" -ForegroundColor Green
    } else {
        # Create basic .env file
        $envContent = @"
# Database - Using SQLite instead of PostgreSQL
DATABASE_URL="file:./dev.db"

# Redis - Using in-memory (no Redis needed)
USE_REDIS=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d

# Riot API - ADD YOUR CREDENTIALS
RIOT_CLIENT_ID=your-riot-client-id-here
RIOT_CLIENT_SECRET=your-riot-client-secret-here
RIOT_API_KEY=your-riot-api-key-here
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:1420

# LiveKit - Using cloud or skip for now
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_URL=http://localhost:7880

# Server
PORT=4000

# Encryption key
ENCRYPTION_KEY=dev-key-change-in-production

# Frontend URL
FRONTEND_URL=http://localhost:3000
"@
        Set-Content -Path "apps\api\.env" -Value $envContent
        Write-Host "OK Created apps\api\.env with SQLite configuration" -ForegroundColor Green
    }
} else {
    Write-Host "OK .env file exists" -ForegroundColor Green
}

# Update Prisma schema to use SQLite
Write-Host ""
Write-Host "Configuring database for SQLite..." -ForegroundColor Yellow
$schemaPath = "apps\api\prisma\schema.prisma"
$sqliteSchemaPath = "apps\api\prisma\schema.sqlite.prisma"
if (Test-Path $sqliteSchemaPath) {
    Copy-Item $sqliteSchemaPath $schemaPath -Force
    Write-Host "OK Updated Prisma schema for SQLite" -ForegroundColor Green
} else {
    Write-Host "WARNING: SQLite schema not found. You may need to manually update schema.prisma" -ForegroundColor Yellow
}

# Generate Prisma client
Write-Host ""
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
Set-Location apps\api
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Prisma generate failed. You may need to install Prisma globally: npm install -g prisma" -ForegroundColor Yellow
}
Set-Location ..\..

# Run migrations
Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow
Set-Location apps\api
npm run prisma:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Migration failed. You may need to run: npx prisma migrate dev" -ForegroundColor Yellow
}
Set-Location ..\..

# Build shared packages
Write-Host ""
Write-Host "Building shared packages..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Build failed. This may be okay for first run." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete (No Docker Mode)!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT CHANGES:" -ForegroundColor Yellow
Write-Host "- Using SQLite instead of PostgreSQL (database file: apps\api\prisma\dev.db)" -ForegroundColor White
Write-Host "- Redis features will be limited (using in-memory fallback)" -ForegroundColor White
Write-Host "- LiveKit voice may not work without Docker (can be configured later)" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit apps\api\.env with your Riot API credentials" -ForegroundColor White
Write-Host "2. Get credentials from https://developer.riotgames.com/" -ForegroundColor White
Write-Host "3. Run npm run dev to start development servers" -ForegroundColor White
Write-Host ""
Write-Host "Web app: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API: http://localhost:4000" -ForegroundColor Cyan
Write-Host ""
