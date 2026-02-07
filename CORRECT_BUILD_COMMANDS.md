# Correct Build Commands

## The Issue
You tried: `cd packages/shared npm run build cd ../..`
This doesn't work because `cd` can't take multiple arguments.

## Correct Syntax

### Option 1: Use && to Chain Commands

```bash
# 1. Build shared package first
cd packages/shared && npm run build && cd ../..

# 2. Build riot package
cd packages/riot && npm run build && cd ../..

# 3. Build everything
npm run build
```

### Option 2: Run Commands Separately

```bash
# 1. Build shared
cd packages/shared
npm run build
cd ../..

# 2. Build riot
cd packages/riot
npm run build
cd ../..

# 3. Build all
npm run build
```

### Option 3: One-Liner (Easiest)

```bash
# Build shared, then riot, then all
(cd packages/shared && npm run build) && (cd packages/riot && npm run build) && npm run build
```

## Quick Copy-Paste Solution

Run these commands one at a time:

```bash
cd packages/shared && npm run build && cd ../..
```

```bash
cd packages/riot && npm run build && cd ../..
```

```bash
npm run build
```

## What && Does

- `&&` means "run the next command only if the previous one succeeded"
- `cd packages/shared && npm run build` = "change to shared directory, THEN run build"
- `cd ../..` = "go back to project root"

## After Build Succeeds

Once all packages build successfully, continue with setup:

```bash
# Start Docker services
cd infra
docker compose up -d
cd ..

# Setup database
cd apps/api
npm run prisma:generate
npm run prisma:migrate
cd ../..

# Start development
npm run dev
```
