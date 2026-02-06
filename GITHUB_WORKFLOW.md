# GitHub Workflow Guide

## Initial Setup

### 1. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `league-voice-companion` (or your choice)
3. Description: "League of Legends companion app with live lobby detection and voice rooms"
4. Choose Public or Private
5. **Don't** check "Initialize with README" (we have files already)
6. Click "Create repository"

### 2. Push from Windows

```powershell
cd D:\League_Voice_comm

# Initialize git (if not done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: League Voice Companion"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/league-voice-companion.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Clone on Linux

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/league-voice-companion.git
cd league-voice-companion

# Run setup
chmod +x setup-linux.sh
./setup-linux.sh
```

## Daily Development Workflow

### On Windows (Making Changes)

```powershell
# Make your code changes...

# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

### On Linux (Getting Updates)

```bash
# Quick update (no Docker restart needed for code changes)
git pull origin main
npm run build  # If packages changed
npm run dev    # Restart dev servers
```

## Update Workflow

### Scenario 1: Code Changes Only

```bash
# Pull latest code
git pull origin main

# Rebuild if needed
npm run build

# Restart dev servers
# (Ctrl+C to stop, then npm run dev)
```

### Scenario 2: New Dependencies Added

```bash
# Pull latest
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart
npm run dev
```

### Scenario 3: Database Schema Changes

```bash
# Pull latest
git pull origin main

# Install dependencies
npm install

# Run new migrations
cd apps/api
npm run prisma:migrate
cd ../..

# Restart
npm run dev
```

### Scenario 4: Docker Configuration Changed

```bash
# Pull latest
git pull origin main

# Stop old containers
cd infra
docker compose down

# Start new containers
docker compose up -d
cd ..

# Run migrations if needed
cd apps/api
npm run prisma:migrate
cd ../..
```

### Scenario 5: Complete Reset (Major Update)

```bash
# Use the update script
chmod +x update-linux.sh
./update-linux.sh
# Choose option 3 (Fresh install)
```

## Using the Update Script

The `update-linux.sh` script handles updates automatically:

```bash
# Make executable (one time)
chmod +x update-linux.sh

# Run update
./update-linux.sh

# Choose update type:
# 1 = Quick (just pull and restart)
# 2 = Full (rebuild everything)
# 3 = Fresh (delete everything and reinstall)
```

## Docker Container Management

### View What's Running
```bash
docker ps
```

### Stop Containers (Keeps Data)
```bash
cd infra
docker compose down
```

### Stop and Remove Containers (Keeps Data)
```bash
cd infra
docker compose down
# Containers removed, but volumes (database) remain
```

### Complete Removal (Deletes Database!)
```bash
cd infra
docker compose down -v
# -v flag removes volumes = deletes database
```

### Restart After Update
```bash
cd infra
docker compose up -d
```

### View Logs (Debugging)
```bash
cd infra
docker compose logs
docker compose logs postgres
docker compose logs redis
```

## Common Update Scenarios

### "I pulled new code, now what?"
```bash
npm install        # If package.json changed
npm run build      # Rebuild packages
npm run dev        # Restart dev servers
```

### "Database schema changed"
```bash
cd apps/api
npm run prisma:migrate
cd ../..
```

### "Docker containers won't start"
```bash
cd infra
docker compose down
docker compose up -d
docker compose logs  # Check for errors
```

### "Need to start completely fresh"
```bash
./update-linux.sh
# Choose option 3
```

## Best Practices

1. **Commit often** - Push changes to GitHub regularly
2. **Pull before starting work** - Always `git pull` before coding
3. **Test locally** - Test changes before pushing
4. **Use branches** - Create feature branches for major changes
5. **Document changes** - Write clear commit messages

## Branch Workflow (Advanced)

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes, commit
git add .
git commit -m "Add new feature"

# Push branch
git push origin feature/new-feature

# Merge to main (on GitHub or locally)
git checkout main
git merge feature/new-feature
git push origin main
```
