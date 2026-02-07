# Fix Build Output Location

## The Problem
Build is creating `dist/apps` and `dist/packages` instead of putting `main.js` directly in `dist/`.

## Fix Applied
Updated `tsconfig.json` to set `rootDir: "./src"` so output goes to `dist/` directly.

## After Pulling Fix

### Step 1: Pull Latest Changes

```bash
cd ~/League_Comms
git pull origin main
```

### Step 2: Clean and Rebuild

```bash
cd apps/api

# Remove old dist
rm -rf dist

# Rebuild
npm run build
```

### Step 3: Verify Output

```bash
ls dist
# Should see: main.js (not dist/apps/api/main.js)
```

### Step 4: Start Dev

```bash
cd ~/League_Comms
npm run dev
```

## What Changed

- Added `rootDir: "./src"` to `apps/api/tsconfig.json`
- This ensures output goes to `dist/` instead of `dist/apps/api/`

## Quick Fix Sequence

```bash
# 1. Pull fix
cd ~/League_Comms
git pull origin main

# 2. Clean and rebuild
cd apps/api
rm -rf dist
npm run build

# 3. Verify
ls dist
# Should see main.js

# 4. Start dev
cd ~/League_Comms
npm run dev
```

The build should now create `dist/main.js` correctly.
