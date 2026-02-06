# Windows Setup Guide

## Prerequisites Installation

### 1. Install Node.js
1. Download Node.js 18+ from https://nodejs.org/
2. Run the installer (choose "Add to PATH" option)
3. Verify installation:
```powershell
node --version
npm --version
```

### 2. Install Docker Desktop for Windows
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop/
2. Install and restart your computer if prompted
3. Start Docker Desktop
4. Verify installation:
```powershell
docker --version
docker-compose --version
```

### 3. Install Rust (for Tauri desktop app)
1. Download rustup-init.exe from https://rustup.rs/
2. Run the installer
3. Choose "1) Proceed with installation (default)"
4. Verify installation:
```powershell
rustc --version
cargo --version
```

### 4. Install Git (if not already installed)
1. Download from https://git-scm.com/download/win
2. Install with default options
3. Verify:
```powershell
git --version
```

## Project Setup

### 1. Open PowerShell or Command Prompt
Navigate to your project directory:
```powershell
cd D:\League_Voice_comm
```

### 2. Install Dependencies
```powershell
npm install
```

This may take a few minutes as it installs all packages for the monorepo.

### 3. Start Docker Services
Open a new PowerShell window and run:
```powershell
cd D:\League_Voice_comm\infra
docker-compose up -d
```

Wait for all services to start. Verify they're running:
```powershell
docker ps
```

You should see:
- `league-voice-postgres`
- `league-voice-redis`
- `league-voice-livekit`

### 4. Set Up Environment Variables
Create the API environment file:
```powershell
cd D:\League_Voice_comm\apps\api
Copy-Item .env.example .env
```

Edit `apps/api/.env` with your text editor (Notepad, VS Code, etc.) and add:
```env
# Database (already configured for Docker)
DATABASE_URL="postgresql://league_voice:league_voice_dev@localhost:5432/league_voice?schema=public"

# Redis (already configured for Docker)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT (change in production)
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d

# Riot API - GET THESE FROM https://developer.riotgames.com/
RIOT_CLIENT_ID=your-riot-client-id-here
RIOT_CLIENT_SECRET=your-riot-client-secret-here
RIOT_API_KEY=your-riot-api-key-here
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:1420

# LiveKit (default dev keys)
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_URL=http://localhost:7880

# Server
PORT=4000

# Encryption key (change in production)
ENCRYPTION_KEY=dev-key-change-in-production

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 5. Get Riot API Credentials
1. Go to https://developer.riotgames.com/
2. Sign in with your Riot account
3. Create a new application
4. Copy your:
   - Client ID
   - Client Secret
   - API Key (Development key works for testing)
5. Add redirect URI: `http://localhost:4000/auth/riot/callback`

### 6. Set Up Database
```powershell
cd D:\League_Voice_comm\apps\api
npm run prisma:generate
npm run prisma:migrate
```

If you get an error about Prisma, you may need to install it globally first:
```powershell
npm install -g prisma
```

### 7. Build Shared Packages
From the root directory:
```powershell
cd D:\League_Voice_comm
npm run build
```

## Running the Application

### Option 1: Run Everything Together (Recommended)
From the root directory:
```powershell
npm run dev
```

This starts all services using Turbo.

### Option 2: Run Services Separately

**Terminal 1 - API Server:**
```powershell
cd D:\League_Voice_comm\apps\api
npm run dev
```

**Terminal 2 - Web App:**
```powershell
cd D:\League_Voice_comm\apps\web
npm run dev
```

**Terminal 3 - Desktop App (optional):**
```powershell
cd D:\League_Voice_comm\apps\desktop
npm run tauri:dev
```

## Verify Everything is Working

1. **Check API Health:**
   Open browser: http://localhost:4000/health
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Check Web App:**
   Open browser: http://localhost:3000
   Should show the League Voice Companion homepage

3. **Check Database:**
   ```powershell
   cd D:\League_Voice_comm\apps\api
   npm run prisma:studio
   ```
   This opens Prisma Studio at http://localhost:5555

## Common Windows Issues & Solutions

### Issue: "docker-compose: command not found"
**Solution:** Use `docker compose` (without hyphen) on newer Docker versions:
```powershell
docker compose up -d
```

### Issue: Port already in use
**Solution:** Check what's using the port:
```powershell
netstat -ano | findstr :4000
netstat -ano | findstr :3000
```
Kill the process or change ports in `.env`

### Issue: Prisma migration fails
**Solution:** Make sure Docker containers are running:
```powershell
docker ps
```
If PostgreSQL isn't running:
```powershell
cd D:\League_Voice_comm\infra
docker-compose up -d postgres
```

### Issue: "Cannot find module" errors
**Solution:** Rebuild packages:
```powershell
npm run build
```

### Issue: Tauri build fails
**Solution:** Make sure Rust is installed and in PATH:
```powershell
rustc --version
```
If not found, restart your terminal after installing Rust.

### Issue: Permission denied on Docker
**Solution:** Run PowerShell as Administrator, or ensure Docker Desktop is running with proper permissions.

## Development Workflow

1. **Start Docker services** (one time, or when you restart your computer):
   ```powershell
   cd infra
   docker-compose up -d
   ```

2. **Start development servers:**
   ```powershell
   npm run dev
   ```

3. **Access the apps:**
   - Web: http://localhost:3000
   - API: http://localhost:4000
   - API Docs: http://localhost:4000/health

4. **Stop everything:**
   - Press `Ctrl+C` in terminal to stop dev servers
   - Stop Docker: `docker-compose down` (in infra directory)

## Next Steps

1. Visit http://localhost:3000/settings
2. Click "Connect Riot Account"
3. Complete OAuth flow
4. Enable "Auto Join Voice" in settings
5. Start a League game to test live detection!

## Troubleshooting

If you encounter issues:

1. **Check Docker is running:**
   ```powershell
   docker ps
   ```

2. **Check logs:**
   ```powershell
   docker-compose logs
   ```

3. **Restart Docker services:**
   ```powershell
   cd infra
   docker-compose restart
   ```

4. **Clear and rebuild:**
   ```powershell
   npm run build
   ```

5. **Check Node version:**
   ```powershell
   node --version
   ```
   Should be 18.0.0 or higher.
