# Fix Type Casting Errors

## The Problem
TypeScript is seeing two different RxJS Observable types and won't allow direct casting. The error says to convert to `unknown` first.

## Fixes Applied

### 1. Fixed Interceptor Type Casting
Changed from `as Observable<any>` to `as unknown as Observable<any>` to bypass duplicate RxJS type conflicts.

### 2. Fixed NestFactory Type
Changed from generic type parameter to type assertion to avoid CORS type conflicts.

## After Pulling Fixes

### Step 1: Pull Latest Changes

```bash
cd ~/League_Comms
git pull origin main
```

### Step 2: Rebuild

```bash
cd apps/api
npm run build
```

This should work now because:
- Type casting uses `unknown` first (as TypeScript suggests)
- NestFactory uses type assertion instead of generic
- `skipLibCheck` is enabled to ignore declaration file conflicts

## If Still Failing

Try removing build cache:

```bash
cd apps/api
rm -rf dist
rm -rf .nest
npm run build
```

## After Build Succeeds

```bash
# Start development
cd ~/League_Comms
npm run dev
```

## What Changed

1. **Interceptor**: `result as unknown as Observable<any>` - Bypasses type conflicts
2. **NestFactory**: Uses type assertion instead of generic to avoid CORS type issues

These changes work around the duplicate RxJS type conflicts.
