# Fix GameModule and create-env Script

## Issues Fixed

1. **GameModule missing RiotAuthModule import** - `GameDetectionService` needs `RiotAuthService`
2. **create-env script location** - Must be run from project root, not `apps/api`

## Fixes Applied

### 1. GameModule Import Fix

Added `RiotAuthModule` to `GameModule` imports so `GameDetectionService` can use `RiotAuthService`.

### 2. create-env Script Usage

The `create-env` script is in the **root** `package.json`, not `apps/api/package.json`.

## How to Use create-env

### ✅ Correct Way (From Project Root)

```bash
# From project root (~/League_Comms)
cd ~/League_Comms
npm run create-env
```

### ❌ Wrong Way (From apps/api)

```bash
# This won't work
cd apps/api
npm run create-env  # Error: Missing script
```

## After Pulling Fixes

### Step 1: Pull Latest Changes

```bash
cd ~/League_Comms
git pull origin main
```

### Step 2: Create .env File (From Root)

```bash
# Make sure you're in the project root
cd ~/League_Comms
npm run create-env
```

### Step 3: Rebuild API

```bash
cd apps/api
npm run build
```

### Step 4: Start Dev

```bash
cd ~/League_Comms
npm run dev
```

## Quick Fix Sequence

```bash
# 1. Pull fixes
cd ~/League_Comms
git pull origin main

# 2. Create .env (from root!)
npm run create-env

# 3. Edit .env with Riot credentials
nano apps/api/.env

# 4. Rebuild
cd apps/api
npm run build

# 5. Start dev
cd ~/League_Comms
npm run dev
```

## Alternative: Use Setup Script

The setup scripts automatically create `.env`:

```bash
# Linux
./setup-linux.sh

# Windows
.\setup-windows.ps1
```

These scripts handle everything automatically!
