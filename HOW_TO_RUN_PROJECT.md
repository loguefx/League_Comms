# How to Run Your Project

## Quick Start (Recommended)

From the project root directory:

```powershell
npm run dev
```

This will start:
- **API Server**: http://localhost:4000
- **Web App**: http://localhost:3000

## If That Doesn't Work

### Option 1: Build First, Then Run

Some projects need to be built before running in dev mode:

```powershell
# Build everything
npm run build

# Then start dev
npm run dev
```

### Option 2: Start Servers Separately

If you want more control or see individual logs:

**Terminal 1 - API Server:**
```powershell
cd apps\api
npm run dev
```

**Terminal 2 - Web App:**
```powershell
cd apps\web
npm run dev
```

## Check if Servers Are Running

```powershell
# Check if ports are in use
netstat -ano | findstr ":3000 :4000"

# Test API (should return health status)
Invoke-WebRequest http://localhost:4000/health

# Open web app in browser
Start-Process http://localhost:3000
```

## Common Issues

### Port Already in Use
```powershell
# Find what's using port 4000
netstat -ano | findstr ":4000"

# Kill the process (replace <PID> with the number from above)
taskkill /PID <PID> /F
```

### Database Not Set Up
If the API fails to start, you might need to set up the database:

```powershell
cd apps\api
npm run prisma:migrate
```

### Missing .env File
Make sure you have a `.env` file in `apps/api/`:

```powershell
# Check if .env exists
Test-Path apps\api\.env

# If not, create it
npm run create-env
```

## What You Should See

When `npm run dev` runs successfully, you should see:
- ✅ API server starting on port 4000
- ✅ Web app starting on port 3000
- ✅ Both servers running and ready

Then open http://localhost:3000 in your browser!
