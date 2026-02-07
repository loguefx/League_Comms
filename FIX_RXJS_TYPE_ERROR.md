# Fix RxJS Type Error

## The Problem
TypeScript compilation error with `RiotRateLimitInterceptor` - RxJS type incompatibility.

## Fix Applied
Updated the interceptor to properly cast the return type and removed unused imports.

## After Fix

### Step 1: Rebuild API

```bash
cd ~/League_Comms/apps/api
npm run build
```

### Step 2: Start Development

```bash
cd ~/League_Comms
npm run dev
```

## If Still Getting Errors

### Check RxJS Version

```bash
cd apps/api
npm list rxjs
```

Should show a consistent version. If not:

```bash
npm install rxjs@latest
```

### Clean and Rebuild

```bash
# Remove build artifacts
rm -rf apps/api/dist

# Rebuild
cd apps/api
npm run build
cd ../..
```

## Verify Build

After building, check:

```bash
ls apps/api/dist
```

Should see `main.js` file.

## Then Start Dev

```bash
npm run dev
```

The type error should be resolved now.
