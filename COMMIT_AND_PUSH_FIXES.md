# Commit and Push TypeScript Fixes

## Changes Made

I've updated these files to fix the build issues:
- `tsconfig.json` - Points to `dist` instead of `src` for shared package
- `packages/riot/tsconfig.json` - Updated configuration
- `packages/shared/tsconfig.json` - Updated configuration

## Push to GitHub

### Step 1: Check What Changed

```powershell
cd D:\League_Voice_comm
git status
```

### Step 2: Add Changed Files

```powershell
git add tsconfig.json packages/riot/tsconfig.json packages/shared/tsconfig.json
```

### Step 3: Commit Changes

```powershell
git commit -m "Fix TypeScript build configuration - point shared package to dist instead of src"
```

### Step 4: Push to GitHub

```powershell
git push origin main
```

## After Pushing

On your Linux machine:

```bash
# Pull updates
cd ~/League_Comms
git pull origin main

# Rebuild packages
cd packages/shared && npm run build && cd ../..
cd packages/riot && npm run build && cd ../..
npm run build
```

## Quick Command Sequence (Windows)

```powershell
cd D:\League_Voice_comm
git add tsconfig.json packages/riot/tsconfig.json packages/shared/tsconfig.json
git commit -m "Fix TypeScript build configuration"
git push origin main
```

## Verify Push

Check on GitHub:
https://github.com/loguefx/League_Comms

You should see the commit with the TypeScript fixes.
