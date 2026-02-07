# Fix TypeScript Configuration Error

## Problem
TypeScript is trying to compile `shared` source files directly instead of using the built output. This causes `rootDir` errors.

## Solution: Build Shared First, Then Use References

### Step 1: Make Sure Shared is Built

```bash
# Build shared package first (creates dist folder)
cd packages/shared
npm run build
cd ../..
```

### Step 2: Verify Shared Build Output Exists

```bash
# Check that dist folder exists
ls packages/shared/dist

# Should see: index.js, index.d.ts, types/, schemas/, constants/
```

### Step 3: Build Riot Package

```bash
# Now build riot (it will use shared's built output)
cd packages/riot
npm run build
cd ../..
```

## Alternative: Use TypeScript Project References

The tsconfig files have been updated to use project references. This tells TypeScript to use the built output from `shared` instead of trying to compile source files.

## Complete Build Sequence

```bash
# 1. Clean previous builds
rm -rf packages/*/dist

# 2. Build shared first
cd packages/shared && npm run build && cd ../..

# 3. Build riot (depends on shared)
cd packages/riot && npm run build && cd ../..

# 4. Build ui (if it exists)
cd packages/ui && npm run build && cd ../..

# 5. Build everything
npm run build
```

## If Still Getting Errors

### Check TypeScript Version

```bash
# Make sure TypeScript is installed
npm list typescript

# Should show version 5.3.3 or similar
```

### Reinstall Dependencies

```bash
# Clean and reinstall
rm -rf node_modules packages/*/node_modules
npm install
```

### Build with Verbose Output

```bash
# See detailed errors
cd packages/riot
npx tsc --verbose
```

## Root Cause

The issue is that TypeScript's `rootDir` is set to `packages/riot/src`, but it's trying to include files from `packages/shared/src` which are outside that directory. The solution is to:

1. Build `shared` first (creates compiled output)
2. Use TypeScript project references (tells TypeScript to use built output)
3. Or use `skipLibCheck: true` to skip type checking of dependencies

The configuration has been updated to handle this properly.
