# Fix Duplicate RxJS Installation

## The Problem
There are two different RxJS installations causing type incompatibility:
- `/home/vboxuser/League_Comms/node_modules/rxjs` (root)
- `/home/vboxuser/League_Comms/apps/api/node_modules/rxjs` (app)

## Solution 1: Fix Return Type (Applied)

I've updated the interceptor to return `Observable<any> | Promise<Observable<any>>` which matches NestJS's expected type.

## Solution 2: Remove Duplicate RxJS (If Still Failing)

If the error persists, remove duplicate RxJS:

```bash
# Remove duplicate node_modules
rm -rf apps/api/node_modules/rxjs

# Reinstall dependencies
cd ~/League_Comms
npm install
```

## Solution 3: Ensure RxJS is Only at Root

```bash
# Check for duplicate RxJS
find . -name "rxjs" -type d | grep node_modules

# Should only show root node_modules/rxjs
# If apps/api/node_modules/rxjs exists, remove it
```

## After Fix

### Pull Latest Changes

```bash
cd ~/League_Comms
git pull origin main
```

### Rebuild

```bash
cd apps/api
npm run build
```

### If Still Failing

```bash
# Clean and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
cd apps/api
npm run build
```

## Verify

After building:

```bash
ls apps/api/dist
# Should see main.js
```

Then start dev:

```bash
cd ~/League_Comms
npm run dev
```
