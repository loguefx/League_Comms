# GitHub Setup & Update Guide

## Step 1: Push Project to GitHub

### On Windows (Current Machine)

1. **Initialize Git Repository** (if not already done):
```powershell
cd D:\League_Voice_comm
git init
```

2. **Create .gitignore** (if not exists):
```powershell
# Check if .gitignore exists
Test-Path .gitignore
```

The `.gitignore` should already exist and include:
- `node_modules/`
- `.env` files
- `dist/`, `build/`
- Database files
- etc.

3. **Add All Files**:
```powershell
git add .
```

4. **Create Initial Commit**:
```powershell
git commit -m "Initial commit: League Voice Companion"
```

5. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository (e.g., `league-voice-companion`)
   - **Don't** initialize with README (we already have files)

6. **Add Remote and Push**:
```powershell
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/league-voice-companion.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Clone on Linux

### On Linux Machine

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/league-voice-companion.git
cd league-voice-companion

# Run setup script
chmod +x setup-linux.sh
./setup-linux.sh
```

## Step 3: Updating to New Version

### Method 1: Pull Latest Changes (Recommended)

```bash
# Stop running containers
cd infra
docker compose down

# Pull latest code
cd ..
git pull origin main

# Rebuild if needed
npm install  # Install any new dependencies
npm run build  # Rebuild packages

# Restart Docker containers
cd infra
docker compose up -d

# Run any new migrations
cd ../apps/api
npm run prisma:migrate
```

### Method 2: Fresh Install (If Major Changes)

```bash
# Stop and remove everything
cd infra
docker compose down -v  # -v removes volumes (deletes database!)

# Remove old code
cd ..
cd ..
rm -rf league-voice-companion

# Clone fresh
git clone https://github.com/YOUR_USERNAME/league-voice-companion.git
cd league-voice-companion

# Run setup again
./setup-linux.sh
```

## Docker Container Management

### View Running Containers
```bash
docker ps
```

### Stop Containers
```bash
cd infra
docker compose down
```

### Stop and Remove Containers (keeps data)
```bash
cd infra
docker compose down
```

### Stop and Remove Containers + Volumes (deletes database!)
```bash
cd infra
docker compose down -v
```

### Restart Containers
```bash
cd infra
docker compose restart
```

### View Container Logs
```bash
cd infra
docker compose logs
docker compose logs postgres
docker compose logs redis
docker compose logs livekit
```

### Remove Specific Container
```bash
docker stop league-voice-postgres
docker rm league-voice-postgres
```

## Update Workflow

### Quick Update (No Breaking Changes)

```bash
# 1. Pull latest code
git pull origin main

# 2. Update dependencies (if package.json changed)
npm install

# 3. Rebuild packages
npm run build

# 4. Restart containers (if needed)
cd infra
docker compose restart
cd ..
```

### Major Update (Breaking Changes)

```bash
# 1. Stop containers
cd infra
docker compose down

# 2. Pull latest code
cd ..
git pull origin main

# 3. Update dependencies
npm install

# 4. Rebuild everything
npm run build

# 5. Run migrations (if database schema changed)
cd apps/api
npm run prisma:migrate
cd ../..

# 6. Restart containers
cd infra
docker compose up -d
```

### Complete Reset (Start Fresh)

```bash
# 1. Stop and remove everything
cd infra
docker compose down -v  # Removes volumes (deletes database!)

# 2. Remove node_modules
cd ..
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# 3. Pull latest
git pull origin main

# 4. Fresh install
npm install
npm run build

# 5. Recreate containers
cd infra
docker compose up -d

# 6. Set up database fresh
cd ../apps/api
npm run prisma:migrate
```

## Creating Update Script

Let me create an update script for you:
