# Fix AuthService Dependency Injection

## The Problem
Error: `Nest can't resolve dependencies of the RiotAuthService (PrismaService, ?, RSOClient, ConfigService). Please make sure that the argument AuthService at index [1] is available in the RiotAuthModule context.`

## The Issue
`RiotAuthService` needs `AuthService`, but `RiotAuthModule` doesn't import `AuthModule` where `AuthService` is provided.

## Fix Applied
Added `AuthModule` to the imports of `RiotAuthModule`.

## After Pulling Fix

### Step 1: Pull Latest Changes

```bash
cd ~/League_Comms
git pull origin main
```

### Step 2: Rebuild API

```bash
cd apps/api
npm run build
```

### Step 3: Start Dev

```bash
cd ~/League_Comms
npm run dev
```

## What Changed

- Added `import { AuthModule } from '../auth.module';` to `riot-auth.module.ts`
- Added `AuthModule` to the `imports` array in `RiotAuthModule`

## Quick Fix Sequence

```bash
# 1. Pull fix
cd ~/League_Comms
git pull origin main

# 2. Rebuild
cd apps/api
npm run build

# 3. Start dev
cd ~/League_Comms
npm run dev
```

The API should now start successfully!
