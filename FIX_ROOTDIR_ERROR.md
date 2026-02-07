# Fix rootDir Error

## The Problem
Setting `rootDir: "./src"` causes TypeScript to complain that `packages/shared/src` files are outside the rootDir.

## Fix Applied
1. Removed `rootDir` - Let TypeScript infer it
2. Updated paths to point to `dist` instead of `src` - Use built output from shared/riot packages

## After Pulling Fix

### Step 1: Pull Latest Changes

```bash
cd ~/League_Comms
git pull origin main
```

### Step 2: Make Sure Shared and Riot Are Built

```bash
# Build shared first
cd packages/shared
npm run build
cd ../..

# Build riot
cd packages/riot
npm run build
cd ../..
```

### Step 3: Clean and Rebuild API

```bash
cd apps/api

# Remove old dist
rm -rf dist

# Rebuild
npm run build
```

### Step 4: Verify Output

```bash
ls dist
# Should see: main.js
```

### Step 5: Start Dev

```bash
cd ~/League_Comms
npm run dev
```

## What Changed

1. **Removed rootDir**: Let TypeScript infer it automatically
2. **Updated paths**: Changed from `packages/shared/src` to `packages/shared/dist` - uses built output
3. This prevents TypeScript from trying to compile source files from other packages

## Quick Fix Sequence

```bash
# 1. Pull fix
cd ~/League_Comms
git pull origin main

# 2. Build shared and riot
cd packages/shared && npm run build && cd ../..
cd packages/riot && npm run build && cd ../..

# 3. Rebuild API
cd apps/api
rm -rf dist
npm run build

# 4. Verify
ls dist
# Should see main.js

# 5. Start dev
cd ~/League_Comms
npm run dev
```

The key is using the built output (`dist`) from shared/riot packages instead of source files.
