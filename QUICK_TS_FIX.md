# Quick Fix for TypeScript Errors

## The Problem
TypeScript can't find files from `@league-voice/shared` because they're outside the `rootDir`.

## Quick Fix (3 Steps)

### Step 1: Build Shared Package
```bash
cd packages/shared && npm run build && cd ../..
```

### Step 2: Verify Build Output
```bash
ls packages/shared/dist
# Should see: index.js, index.d.ts, and folders
```

### Step 3: Build Riot Package
```bash
cd packages/riot && npm run build && cd ../..
```

## Why This Works

- Building `shared` first creates the compiled output in `dist/`
- TypeScript can then reference the built files instead of source files
- The `rootDir` error goes away because we're using compiled output

## After Both Build Successfully

```bash
# Build everything
npm run build
```

## If It Still Fails

Try a clean rebuild:

```bash
# Remove all build artifacts
rm -rf packages/*/dist

# Rebuild in order
cd packages/shared && npm run build && cd ../..
cd packages/riot && npm run build && cd ../..
npm run build
```
