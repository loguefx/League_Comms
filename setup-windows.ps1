# Windows Setup Script for League Voice Companion
# Run this script in PowerShell (as Administrator if needed)

Write-Host "League Voice Companion - Windows Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
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

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerCheck = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCheck) {
    $dockerVersion = docker --version
    Write-Host "OK Docker found: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "ERROR: Docker not found. Please install Docker Desktop from https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    exit 1
}

# Check Rust (optional, for desktop app)
Write-Host "Checking Rust..." -ForegroundColor Yellow
$rustCheck = Get-Command rustc -ErrorAction SilentlyContinue
if ($rustCheck) {
    $rustVersion = rustc --version
    Write-Host "OK Rust found: $rustVersion" -ForegroundColor Green
} else {
    Write-Host "WARNING: Rust not found. Desktop app will not work. Install from https://rustup.rs/" -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "OK Dependencies installed" -ForegroundColor Green

# Check if .env exists
Write-Host ""
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path "apps\api\.env")) {
    Write-Host "Creating .env file with default values..." -ForegroundColor Yellow
    node scripts/create-env.js
} else {
    Write-Host "OK .env file exists" -ForegroundColor Green
}

# Start Docker services
Write-Host ""
Write-Host "Starting Docker services..." -ForegroundColor Yellow
Set-Location infra
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start Docker services" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "OK Docker services started" -ForegroundColor Green
Set-Location ..

# Wait for services to be ready
Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

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
    Write-Host "WARNING: Migration failed. Make sure Docker services are running." -ForegroundColor Yellow
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
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit apps\api\.env with your Riot API credentials" -ForegroundColor White
Write-Host "2. Get credentials from https://developer.riotgames.com/" -ForegroundColor White
Write-Host "3. Run npm run dev to start development servers" -ForegroundColor White
Write-Host ""
Write-Host "Web app: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API: http://localhost:4000" -ForegroundColor Cyan
Write-Host ""
