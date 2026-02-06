# How to Start the Servers

## Quick Start

### Option 1: Start Everything (Recommended)
```powershell
npm run dev
```

This starts both web (port 3000) and API (port 4000) servers.

### Option 2: Start Servers Separately

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

## Check if Servers are Running

```powershell
# Check ports
netstat -ano | findstr ":3000 :4000"

# Test API
Invoke-WebRequest http://localhost:4000/health

# Test Web
Start-Process http://localhost:3000
```

## Common Issues

### API Not Starting
1. Check if database is set up:
   ```powershell
   cd apps\api
   npm run prisma:migrate
   ```

2. Check .env file exists:
   ```powershell
   Test-Path apps\api\.env
   ```

3. Look for errors in the terminal where you ran `npm run dev`

### Port Already in Use
```powershell
# Find what's using the port
netstat -ano | findstr ":4000"

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F
```

## Current Status
- ✅ Web app should be on http://localhost:3000
- ❌ API might have errors - check the terminal output
