# Pull Updates on Linux Machine

## After Pushing Fixes from Windows

The TypeScript configuration fixes have been pushed to GitHub. Now pull them on your Linux machine.

## Step 1: Pull Latest Changes

On your Linux machine:

```bash
# Go to project directory
cd ~/League_Comms

# Pull latest changes
git pull origin main
```

## Step 2: Rebuild Packages

After pulling, rebuild in the correct order:

```bash
# Build shared first
cd packages/shared && npm run build && cd ../..

# Build riot (should work now with the fixes)
cd packages/riot && npm run build && cd ../..

# Build everything
npm run build
```

## Step 3: Continue Setup

After builds succeed:

```bash
# Start Docker services
cd infra && docker compose up -d && cd ..

# Setup database
cd apps/api && npm run prisma:generate && npm run prisma:migrate && cd ../..

# Start development
npm run dev
```

## What Was Fixed

- Updated `tsconfig.json` to point `@league-voice/shared` to `dist` folder instead of `src`
- Updated `packages/riot/tsconfig.json` to properly reference built output
- This prevents TypeScript from trying to compile source files from other packages

## If Pull Fails

If you get merge conflicts or errors:

```bash
# Stash local changes (if any)
git stash

# Pull again
git pull origin main

# Rebuild
cd packages/shared && npm run build && cd ../..
cd packages/riot && npm run build && cd ../..
```

## Verify Updates

Check that the files were updated:

```bash
# Check tsconfig.json was updated
grep "shared/dist" tsconfig.json

# Should show: "@league-voice/shared": ["./packages/shared/dist"]
```
