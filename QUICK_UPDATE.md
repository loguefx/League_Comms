# Quick Update Guide

## Your Repository
https://github.com/loguefx/League_Comms.git

## Daily Update Workflow

### On Windows (After Making Changes)

```powershell
cd D:\League_Voice_comm
git add .
git commit -m "Description of your changes"
git push origin main
```

### On Linux (Getting Updates)

```bash
cd ~/League_Comms

# Quick update script
./update-linux.sh
# Choose option 1 (Quick update)
```

Or manually:

```bash
# Pull latest code
git pull origin main

# If package.json changed
npm install

# Rebuild packages
npm run build

# Restart dev servers
npm run dev
```

## Docker Container Management

### View Running Containers
```bash
docker ps
```

### Stop Containers (Keeps Database)
```bash
cd infra
docker compose down
```

### Remove Containers + Database
```bash
cd infra
docker compose down -v  # -v removes volumes = deletes database!
```

### Restart Containers
```bash
cd infra
docker compose up -d
```

## Update Scenarios

### Scenario 1: Just Code Changes
```bash
git pull origin main
npm run build
npm run dev
```

### Scenario 2: New Dependencies Added
```bash
git pull origin main
npm install
npm run build
npm run dev
```

### Scenario 3: Database Schema Changed
```bash
git pull origin main
npm install
cd apps/api
npm run prisma:migrate
cd ../..
npm run dev
```

### Scenario 4: Docker Config Changed
```bash
cd infra
docker compose down
cd ..
git pull origin main
cd infra
docker compose up -d
cd ..
```

### Scenario 5: Complete Fresh Start
```bash
cd infra
docker compose down -v  # Deletes database!
cd ..
rm -rf League_Comms
git clone https://github.com/loguefx/League_Comms.git
cd League_Comms
./setup-linux.sh
```

## Using the Update Script

```bash
# Make executable (one time)
chmod +x update-linux.sh

# Run update
./update-linux.sh

# Options:
# 1 = Quick update (pull, restart)
# 2 = Full update (rebuild everything)
# 3 = Fresh install (delete everything, reinstall)
```
