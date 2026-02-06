# Complete Linux Setup & Testing Guide

## Prerequisites Installation

### 1. Update System Packages

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Fedora
sudo dnf update -y

# Arch
sudo pacman -Syu
```

### 2. Install Node.js 18+

```bash
# Using NodeSource (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v20.x or higher
npm --version
```

### 3. Install Docker

```bash
# Remove old versions
sudo apt-get remove docker docker-engine docker.io containerd runc

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# Install Docker Compose (if not included)
sudo apt-get install docker-compose-plugin

# Log out and back in for group changes to take effect
# Or run: newgrp docker

# Verify installation
docker --version
docker compose version
```

### 4. Install Rust (for Tauri desktop app)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Verify
rustc --version
cargo --version
```

### 5. Install Git (if not already installed)

```bash
sudo apt-get install git -y
```

## Project Setup

### 1. Clone/Navigate to Project

```bash
cd ~/League_Voice_comm
# Or if you need to clone:
# git clone <your-repo-url> League_Voice_comm
# cd League_Voice_comm
```

### 2. Install Dependencies

```bash
npm install
```

This will install all packages for the monorepo (may take a few minutes).

### 3. Start Docker Services

```bash
cd infra
docker compose up -d
```

Wait a few seconds for services to start, then verify:

```bash
docker ps
```

You should see:
- `league-voice-postgres`
- `league-voice-redis`
- `league-voice-livekit`

### 4. Set Up Environment Variables

```bash
cd ../apps/api
cp .env.example .env
```

Edit `.env` with your favorite editor:

```bash
nano .env
# or
vim .env
# or
code .env
```

Add your Riot API credentials:

```env
# Database (Docker)
DATABASE_URL="postgresql://league_voice:league_voice_dev@localhost:5432/league_voice?schema=public"

# Redis (Docker)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d

# Riot API - GET FROM https://developer.riotgames.com/
RIOT_CLIENT_ID=your-riot-client-id-here
RIOT_CLIENT_SECRET=your-riot-client-secret-here
RIOT_API_KEY=your-riot-api-key-here
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:1420

# LiveKit (Docker)
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_URL=http://localhost:7880

# Server
PORT=4000
FRONTEND_URL=http://localhost:3000

# Encryption
ENCRYPTION_KEY=dev-key-change-in-production
```

### 5. Set Up Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 6. Build Shared Packages

```bash
cd ../..
npm run build
```

## Running the Application

### Option 1: Run Everything Together (Recommended)

```bash
# From project root
npm run dev
```

This starts:
- API server on http://localhost:4000
- Web app on http://localhost:3000
- Desktop app (if you want to test it)

### Option 2: Run Services Separately

**Terminal 1 - API Server:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Web App:**
```bash
cd apps/web
npm run dev
```

**Terminal 3 - Desktop App (optional):**
```bash
cd apps/desktop
npm run tauri:dev
```

## Testing the Application

### 1. Verify Services Are Running

```bash
# Check Docker containers
docker ps

# Check API health
curl http://localhost:4000/health

# Should return: {"status":"ok","timestamp":"..."}

# Open web app in browser
xdg-open http://localhost:3000
# or
firefox http://localhost:3000
# or
google-chrome http://localhost:3000
```

### 2. Test Riot OAuth Flow

1. Open http://localhost:3000 in your browser
2. Navigate to Settings (click Settings in nav bar)
3. Click "Connect Riot Account"
4. Complete OAuth flow
5. You should be redirected back and see your Riot ID

### 3. Test Live Game Detection

1. Make sure "Auto-join voice" is enabled in Settings
2. Start a League of Legends game
3. You should see:
   - A notification popup: "Match Detected!"
   - Click "View Lobby" to see the ban phase
   - The live game page should show both teams

### 4. Test Match History

1. Navigate to "Match History" in the nav bar
2. Should show your recent games
3. Click a match to see detailed stats

### 5. Test Analytics

1. Navigate to "Analytics"
2. Should show champion win rates
3. Try filtering by rank, role, and patch

## Troubleshooting

### Docker Issues

```bash
# Check if Docker is running
sudo systemctl status docker

# Start Docker if not running
sudo systemctl start docker
sudo systemctl enable docker  # Enable on boot

# Check Docker logs
docker compose logs
docker compose logs postgres
docker compose logs redis
```

### Port Already in Use

```bash
# Find what's using the port
sudo lsof -i :4000
sudo lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Permission Denied for Docker

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or:
newgrp docker

# Verify
docker ps
```

### Prisma Migration Fails

```bash
# Make sure Docker is running
docker ps

# Reset database (WARNING: deletes all data)
cd apps/api
npx prisma migrate reset

# Or create fresh migration
npx prisma migrate dev
```

### Node Modules Issues

```bash
# Clean install
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
npm install
```

## Quick Test Checklist

- [ ] Docker containers running (`docker ps`)
- [ ] API health check works (`curl http://localhost:4000/health`)
- [ ] Web app loads (http://localhost:3000)
- [ ] Can connect Riot account (Settings page)
- [ ] Match history loads (if you have games)
- [ ] Analytics page loads
- [ ] Live game detection works (start a League game)

## Development Workflow

1. **Start Docker services** (one time, or when you restart):
   ```bash
   cd infra
   docker compose up -d
   ```

2. **Start development servers**:
   ```bash
   npm run dev
   ```

3. **Make changes** - files auto-reload

4. **Stop everything**:
   - Press `Ctrl+C` in terminal
   - Stop Docker: `docker compose down` (in infra directory)

## Production Build (Optional)

```bash
# Build all apps
npm run build

# Start production API
cd apps/api
npm run start:prod

# Start production web
cd ../web
npm run start
```

## Next Steps

1. Get Riot API credentials from https://developer.riotgames.com/
2. Add them to `apps/api/.env`
3. Test the OAuth flow
4. Start a League game to test live detection
5. Check match history and analytics

## Getting Help

If something doesn't work:

1. Check Docker: `docker ps`
2. Check logs: `docker compose logs`
3. Check API: `curl http://localhost:4000/health`
4. Check browser console for errors
5. Check terminal output for errors
