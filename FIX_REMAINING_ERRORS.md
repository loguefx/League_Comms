# Fix Remaining Build Errors

## Issues Found
1. ❌ CORS type error with Fastify
2. ❌ RxJS type conflict (duplicate installations)

## Fixes Applied

### 1. Fixed CORS Type Error
Added type assertion `as any` to CORS options to bypass Fastify type incompatibility.

### 2. Fixed RxJS Interceptor
Added explicit type casting to resolve Observable type conflicts.

## After Pulling Fixes

### Step 1: Pull Latest Changes

```bash
cd ~/League_Comms
git pull origin main
```

### Step 2: Remove Duplicate RxJS (CRITICAL)

The error shows duplicate RxJS in:
- `/home/vboxuser/League_Comms/node_modules/rxjs`
- `/home/vboxuser/League_Comms/apps/api/node_modules/rxjs`

Remove the duplicate:

```bash
# Remove duplicate RxJS
rm -rf apps/api/node_modules/rxjs
rm -rf apps/api/node_modules/@nestjs
rm -rf apps/api/node_modules/rxjs

# Reinstall to ensure proper linking
npm install
```

### Step 3: Rebuild

```bash
cd apps/api
npm run build
```

### Step 4: If Still Failing - Complete Clean Rebuild

```bash
# Go to root
cd ~/League_Comms

# Remove ALL node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Clear npm cache
npm cache clean --force

# Reinstall everything
npm install

# Rebuild
cd apps/api
npm run build
cd ../..
```

## Why Duplicate RxJS Causes Issues

When RxJS is installed in both root and `apps/api/node_modules`, TypeScript sees them as different types even though they're the same library. This causes type incompatibility errors.

## Verify No Duplicates

After reinstalling, check:

```bash
# Should only show root node_modules
find . -name "rxjs" -type d | grep node_modules
```

Should only show: `./node_modules/rxjs`

## After Build Succeeds

```bash
# Start development
cd ~/League_Comms
npm run dev
```

## Quick Fix Sequence

```bash
# 1. Pull fixes
cd ~/League_Comms
git pull origin main

# 2. Remove ALL duplicate node_modules
rm -rf apps/api/node_modules

# 3. Reinstall
npm install

# 4. Rebuild
cd apps/api
npm run build
cd ../..

# 5. Start dev
npm run dev
```

The key is removing `apps/api/node_modules` entirely so all packages use the root node_modules.
