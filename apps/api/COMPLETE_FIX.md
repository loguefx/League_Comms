# Complete Fix for Prisma Column Mapping Issue

If you're still getting `The column 'matches.matchId' does not exist` after running `npx prisma generate`, follow these steps **in order**:

## Step 1: Stop the Dev Server

Press `Ctrl+C` in the terminal where `npm run dev` is running to stop the server.

## Step 2: Clear Prisma Cache and Regenerate

```bash
cd apps/api

# Remove the Prisma client cache
rm -rf node_modules/.prisma

# Regenerate Prisma client
npx prisma generate
```

## Step 3: Verify Prisma Client Was Generated Correctly

Check that the generated client includes the @map directives:

```bash
# This should show match_id in the generated types
grep -A 10 "model Match" node_modules/.prisma/client/index.d.ts | head -20
```

You should see something like:
```typescript
matchId String @map("match_id")
```

## Step 4: Restart the Dev Server

```bash
# From the project root
npm run dev
```

## Step 5: If It Still Doesn't Work - Nuclear Option

If the above doesn't work, completely reinstall dependencies:

```bash
# From project root
rm -rf node_modules
rm -rf apps/api/node_modules
rm -rf packages/*/node_modules

# Reinstall everything
npm install

# Regenerate Prisma
cd apps/api
npx prisma generate

# Restart
cd ../..
npm run dev
```

## Why This Happens

The Prisma client is generated code that lives in `node_modules/.prisma/client/`. When you:
- Pull new code with schema changes
- Update the Prisma schema
- Change @map directives

You MUST regenerate the Prisma client AND restart your server for the changes to take effect. The dev server caches the Prisma client in memory, so just regenerating isn't enough - you need to restart.

## Verification

After fixing, you should see successful match ingestion logs like:
```
[Nest] INFO [IngestionService] Ingested match NA1_5455487961 (16.3, emerald_plus)
```

Instead of:
```
[Nest] WARN [BatchSeedService] Failed to ingest match NA1_5455487961: PrismaClientKnownRequestError
```
