# Remove All Duplicate RxJS Installations

## The Problem
Even after removing node_modules, npm is reinstalling RxJS in multiple locations:
- `./apps/web/node_modules/rxjs`
- `./apps/api/node_modules/rxjs`
- `./apps/desktop/node_modules/rxjs`
- Plus nested ones in @angular-devkit packages

## Solution: Force Hoisting with .npmrc

I've created a `.npmrc` file that forces npm to hoist all dependencies to the root.

### Step 1: Pull Latest Changes

```bash
cd ~/League_Comms
git pull origin main
```

### Step 2: Remove ALL Duplicates Again

```bash
# Remove all app-level node_modules
rm -rf apps/api/node_modules
rm -rf apps/web/node_modules
rm -rf apps/desktop/node_modules

# Remove nested duplicates in root node_modules
rm -rf node_modules/@angular-devkit/core/node_modules/rxjs
rm -rf node_modules/@angular-devkit/schematics/node_modules/rxjs
rm -rf node_modules/typed-emitter/rxjs
```

### Step 3: Reinstall with Hoisting

```bash
# Reinstall (will use .npmrc to hoist everything)
npm install
```

### Step 4: Verify Only One RxJS

```bash
# Should only show root node_modules/rxjs
find . -name "rxjs" -type d | grep node_modules
```

Should only show: `./node_modules/rxjs`

### Step 5: Rebuild

```bash
cd apps/api
npm run build
```

## If Still Has Duplicates

### Nuclear Option: Complete Clean Rebuild

```bash
# Go to root
cd ~/League_Comms

# Remove EVERYTHING
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -rf package-lock.json

# Clear npm cache
npm cache clean --force

# Fresh install with hoisting
npm install

# Verify
find . -name "rxjs" -type d | grep node_modules
# Should only show: ./node_modules/rxjs

# Rebuild
cd apps/api
npm run build
```

## What .npmrc Does

- `shamefully-hoist=true` - Forces npm to hoist ALL dependencies to root, even if it creates duplicates
- This ensures TypeScript sees only one version of each package

## After Build Succeeds

```bash
# Start development
cd ~/League_Comms
npm run dev
```

## Quick Fix Sequence

```bash
# 1. Pull fixes (includes .npmrc)
cd ~/League_Comms
git pull origin main

# 2. Remove all duplicates
rm -rf apps/*/node_modules
rm -rf node_modules/@angular-devkit/*/node_modules/rxjs
rm -rf node_modules/typed-emitter/rxjs

# 3. Reinstall with hoisting
npm install

# 4. Verify
find . -name "rxjs" -type d | grep node_modules

# 5. Rebuild
cd apps/api
npm run build
```

The `.npmrc` file will prevent future duplicates.
