# League Voice Companion - Push to GitHub
# Run this script in PowerShell to push to GitHub

Write-Host "League Voice Companion - Push to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is configured
$gitName = git config --global user.name
$gitEmail = git config --global user.email

if (-not $gitName -or -not $gitEmail) {
    Write-Host "Git identity not configured!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run these commands first:" -ForegroundColor Yellow
    Write-Host "  git config --global user.name `"Your Name`"" -ForegroundColor White
    Write-Host "  git config --global user.email `"your.email@example.com`"" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Git configured as: $gitName <$gitEmail>" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Not in project root directory!" -ForegroundColor Red
    Write-Host "Please run this from D:\League_Voice_comm" -ForegroundColor Yellow
    exit 1
}

# Check remote
Write-Host "Checking remote configuration..." -ForegroundColor Cyan
$remote = git remote get-url origin
Write-Host "Remote: $remote" -ForegroundColor Green
Write-Host ""

# Check status
Write-Host "Checking git status..." -ForegroundColor Cyan
git status --short
Write-Host ""

# Add all files
Write-Host "Adding all files..." -ForegroundColor Cyan
git add .
Write-Host "✓ Files staged" -ForegroundColor Green
Write-Host ""

# Create commit
Write-Host "Creating commit..." -ForegroundColor Cyan
$commitMessage = "Initial commit: League Voice Companion - Complete monorepo with API, Web, Desktop apps"
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit created" -ForegroundColor Green
    Write-Host ""
    
    # Push to GitHub
    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    Write-Host "Repository: https://github.com/loguefx/League_Comms.git" -ForegroundColor White
    Write-Host ""
    Write-Host "If prompted for credentials:" -ForegroundColor Yellow
    Write-Host "  - Username: loguefx" -ForegroundColor White
    Write-Host "  - Password: Use a Personal Access Token (not your password)" -ForegroundColor White
    Write-Host "  - Get token from: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host ""
    
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "View your repository:" -ForegroundColor Cyan
        Write-Host "  https://github.com/loguefx/League_Comms" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "✗ Push failed. Common issues:" -ForegroundColor Red
        Write-Host "  1. Authentication - Use Personal Access Token" -ForegroundColor Yellow
        Write-Host "  2. Network - Check internet connection" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Get Personal Access Token:" -ForegroundColor Cyan
        Write-Host "  https://github.com/settings/tokens" -ForegroundColor White
    }
} else {
    Write-Host "✗ Commit failed. Check error above." -ForegroundColor Red
}
