# Installing Docker Desktop on Windows

## Step 1: Fix Windows Component Store (If Needed)

If you got the component store corruption error earlier, fix it first:

```powershell
# Run PowerShell as Administrator
# Check component store
DISM /Online /Cleanup-Image /CheckHealth

# Scan for issues
DISM /Online /Cleanup-Image /ScanHealth

# Repair (takes 10-30 minutes)
DISM /Online /Cleanup-Image /RestoreHealth

# Also run System File Checker
sfc /scannow

# Restart your computer after this
```

## Step 2: Install Docker Desktop

1. Download Docker Desktop for Windows:
   - https://www.docker.com/products/docker-desktop/
   - Choose "Docker Desktop for Windows"

2. Run the installer

3. When prompted, enable:
   - ✅ Use WSL 2 instead of Hyper-V (recommended)
   - ✅ Add shortcut to desktop

4. Restart your computer when prompted

5. Start Docker Desktop from Start menu

6. Wait for Docker to start (whale icon in system tray should be steady)

## Step 3: Verify Installation

```powershell
docker --version
docker-compose --version
```

## Step 4: Start Backend Services

```powershell
cd D:\League_Voice_comm\infra
docker-compose up -d
```

## Step 5: Verify Services Are Running

```powershell
docker ps
```

You should see:
- `league-voice-postgres`
- `league-voice-redis`
- `league-voice-livekit`

## Step 6: Set Up Database

```powershell
cd D:\League_Voice_comm\apps\api
npm run prisma:migrate
```

## Step 7: Start API Server

```powershell
cd D:\League_Voice_comm\apps\api
npm run dev
```

The API should now be available at http://localhost:4000
