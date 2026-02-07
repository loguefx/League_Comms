# Quick Fix for Build Error

## The Problem
`@league-voice/riot` can't build because `@league-voice/shared` isn't built yet.

## Quick Fix (3 Commands)

```bash
# 1. Build shared package first
cd packages/shared && npm run build && cd ../..

# 2. Build riot package
cd packages/riot && npm run build && cd ../..

# 3. Build everything (should work now)
npm run build
```

## That's It!

The build should complete successfully. The issue is just build order - shared needs to be built before riot.

## After Build Succeeds

Continue with setup:

```bash
# Continue with Docker setup
cd infra
docker compose up -d
cd ../apps/api
npm run prisma:generate
npm run prisma:migrate
cd ../..
npm run dev
```
