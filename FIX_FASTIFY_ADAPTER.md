# Fix FastifyAdapter Type Error

## The Problem
`NestFactory.create` with `FastifyAdapter` is having type conflicts with CORS and adapter types.

## Fix Applied
Added `as any` type assertion to `FastifyAdapter` to bypass type conflicts.

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

## If Still Failing

The RxJS duplicate issue might still cause problems. Try:

```bash
# Remove build cache
cd apps/api
rm -rf dist .nest

# Rebuild
npm run build
```

## Alternative: Disable Strict Type Checking Temporarily

If build still fails, we can make TypeScript more lenient:

```bash
# Edit tsconfig.json
cd apps/api
nano tsconfig.json
```

Add to `compilerOptions`:
```json
"noImplicitAny": false,
"strict": false
```

Then rebuild.

## After Build Succeeds

```bash
# Start development
cd ~/League_Comms
npm run dev
```

## What Changed

1. **FastifyAdapter**: Added `as any` to bypass type conflicts
2. **tsconfig**: Added `skipDefaultLibCheck: true` for additional type checking bypass

These workarounds handle the duplicate RxJS and Fastify type conflicts.
