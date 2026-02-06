# Push Project to GitHub

Your repository: https://github.com/loguefx/League_Comms.git

## Step 1: Initial Push (Windows)

Run these commands in PowerShell:

```powershell
cd D:\League_Voice_comm

# Initialize git (if not done)
git init

# Add remote (if not already added)
git remote add origin https://github.com/loguefx/League_Comms.git

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: League Voice Companion"

# Push to GitHub
git branch -M main
git push -u origin main
```

If you get authentication errors, you may need to:
- Use a Personal Access Token instead of password
- Or use SSH: `git remote set-url origin git@github.com:loguefx/League_Comms.git`

## Step 2: Clone on Linux

```bash
# Clone your repository
git clone https://github.com/loguefx/League_Comms.git
cd League_Comms

# Run setup script
chmod +x setup-linux.sh
./setup-linux.sh
```

## Step 3: Updating to New Version

### Quick Update (Code Changes Only)

```bash
# Pull latest code
git pull origin main

# Rebuild if needed
npm run build

# Restart dev servers (Ctrl+C, then npm run dev)
```

### Full Update (Dependencies Changed)

```bash
# Stop containers
cd infra
docker compose down
cd ..

# Pull latest
git pull origin main

# Update dependencies
npm install

# Rebuild
npm run build

# Run migrations if database changed
cd apps/api
npm run prisma:migrate
cd ../..

# Restart containers
cd infra
docker compose up -d
cd ..
```

### Complete Reset (Fresh Install)

```bash
# Use the update script
chmod +x update-linux.sh
./update-linux.sh
# Choose option 3
```

## Removing Docker Containers

### Stop Containers (Keeps Database)
```bash
cd infra
docker compose down
```

### Remove Containers + Volumes (Deletes Database!)
```bash
cd infra
docker compose down -v
```

### Remove Everything and Start Fresh
```bash
cd infra
docker compose down -v  # Removes containers AND database
cd ..

# Remove code
cd ..
rm -rf League_Comms

# Clone fresh
git clone https://github.com/loguefx/League_Comms.git
cd League_Comms

# Run setup
./setup-linux.sh
```

## Update Workflow Summary

**When you push new code:**
1. On Linux: `git pull origin main`
2. If dependencies changed: `npm install`
3. Rebuild: `npm run build`
4. If database changed: `cd apps/api && npm run prisma:migrate`
5. Restart: `npm run dev`

**When Docker config changed:**
1. `cd infra && docker compose down`
2. `git pull origin main`
3. `docker compose up -d`

**When you need fresh start:**
1. `cd infra && docker compose down -v` (deletes database!)
2. `cd .. && rm -rf League_Comms`
3. `git clone https://github.com/loguefx/League_Comms.git`
4. `cd League_Comms && ./setup-linux.sh`
