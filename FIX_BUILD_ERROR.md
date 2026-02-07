# Fix Build Error - TypeScript Compilation Failed

## Problem
The `@league-voice/riot` package is failing to build because it depends on `@league-voice/shared`, which needs to be built first.

## Solution: Build Packages in Order

### Option 1: Build Shared First (Recommended)

```bash
# Build shared package first
cd packages/shared
npm run build
cd ../..

# Then build riot package
cd packages/riot
npm run build
cd ../..

# Or build all packages
npm run build
```

### Option 2: Build All Packages

```bash
# Build all packages (Turbo will handle order)
npm run build
```

### Option 3: Clean and Rebuild

```bash
# Remove all build artifacts
rm -rf packages/*/dist packages/*/node_modules

# Reinstall dependencies
npm install

# Build in order
cd packages/shared && npm run build && cd ../..
cd packages/riot && npm run build && cd ../..
cd packages/ui && npm run build && cd ../..
```

## Quick Fix

Run these commands:

```bash
# 1. Build shared package first
cd packages/shared
npm run build
cd ../..

# 2. Build riot package
cd packages/riot
npm run build
cd ../..

# 3. Build all (should work now)
npm run build
```

## Verify Build

```bash
# Check if dist folders exist
ls packages/shared/dist
ls packages/riot/dist

# Should see .js and .d.ts files
```

## If Still Failing

### Check TypeScript Configuration

The issue might be with path resolution. Make sure `packages/riot/tsconfig.json` extends the root config properly.

### Check Dependencies

```bash
# Make sure shared is installed in riot
cd packages/riot
ls node_modules/@league-voice/shared
```

If it doesn't exist:
```bash
# Reinstall dependencies
cd ../..
npm install
```

## Complete Rebuild Sequence

```bash
# 1. Clean everything
rm -rf packages/*/dist node_modules packages/*/node_modules

# 2. Reinstall
npm install

# 3. Build in order
cd packages/shared && npm run build && cd ../..
cd packages/riot && npm run build && cd ../..
cd packages/ui && npm run build && cd ../..

# 4. Verify
npm run build
```
