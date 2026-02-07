# Fix Setup Issues - Quick Guide

## Two Issues to Fix

1. ❌ **Docker permission denied**
2. ❌ **Missing .env.example** (now created)

## Quick Fix

### Step 1: Fix Docker Permissions

```bash
# Add yourself to docker group
sudo usermod -aG docker $USER

# Activate docker group
newgrp docker

# Verify Docker works (should NOT ask for sudo)
docker ps
```

### Step 2: Run Setup Again

```bash
# Now run setup script again
./setup-linux.sh
```

The script will now:
- ✅ Find `.env.example` (just created)
- ✅ Copy it to `.env`
- ✅ Start Docker services (with proper permissions)

### Step 3: Add Riot API Credentials

After setup completes:

```bash
# Edit .env with your Riot credentials
nano apps/api/.env
```

Get credentials from: https://developer.riotgames.com/

## Complete Command Sequence

```bash
# 1. Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# 2. Verify Docker works
docker ps

# 3. Run setup (now that .env.example exists)
./setup-linux.sh

# 4. Add Riot credentials
nano apps/api/.env

# 5. Start development
npm run dev
```

## If Docker Still Doesn't Work

```bash
# Check Docker service
sudo systemctl status docker

# Start Docker if needed
sudo systemctl start docker
sudo systemctl enable docker

# Try again
newgrp docker
docker ps
```

## After Setup Completes

Your app should be running at:
- Web: http://localhost:3000
- API: http://localhost:4000

Verify with:
```bash
# Check containers
docker ps

# Check API
curl http://localhost:4000/health
```
