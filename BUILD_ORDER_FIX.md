# Fix Build Order - Must Build Shared First

## The Problem
TypeScript is trying to compile `shared` source files when building `riot`. The `shared` package must be built FIRST.

## Solution: Build in Correct Order

### Step 1: Go to Project Root

```bash
cd ~/League_Comms
```

### Step 2: Build Shared Package FIRST

```bash
cd packages/shared && npm run build && cd ../..
```

**Wait for this to complete!** You should see it create `dist/` folder.

### Step 3: Verify Shared Built Successfully

```bash
ls packages/shared/dist
```

You should see files like:
- `index.js`
- `index.d.ts`
- `types/` folder
- `schemas/` folder
- `constants/` folder

### Step 4: NOW Build Riot Package

```bash
cd packages/riot && npm run build && cd ../..
```

This should work now because `shared` is already built.

## Complete Sequence (Copy All)

```bash
# 1. Go to root
cd ~/League_Comms

# 2. Build shared FIRST (very important!)
cd packages/shared && npm run build && cd ../..

# 3. Verify shared built
ls packages/shared/dist

# 4. Build riot (depends on shared)
cd packages/riot && npm run build && cd ../..

# 5. Build everything
npm run build
```

## Why This Works

- Building `shared` first creates compiled JavaScript and TypeScript declaration files
- When `riot` builds, it uses the compiled output from `shared`, not the source files
- This avoids the `rootDir` error because we're not trying to compile source files from another package

## If Shared Build Fails

If `shared` build fails, fix that first:

```bash
cd packages/shared
npm run build
# Check for errors
```

Common issues:
- Missing dependencies: `npm install`
- TypeScript errors in shared: Fix those first

## After Both Build Successfully

Continue with setup:

```bash
# Start Docker
cd infra && docker compose up -d && cd ..

# Setup database
cd apps/api && npm run prisma:generate && npm run prisma:migrate && cd ../..

# Start dev
npm run dev
```
