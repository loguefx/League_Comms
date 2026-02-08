# Quick Fix: Column Name Error

## The Error
```
column m.match_id does not exist
```

## The Problem
Your database has columns named `matchId` and `queueId` (camelCase), but the SQL queries expect `match_id` and `queue_id` (snake_case).

## Quick Fix (Run These Commands)

### Step 1: Connect to PostgreSQL and Fix Column Names

```bash
# Connect to your database
psql -U postgres -d LVC

# Run these SQL commands to rename the columns:
ALTER TABLE matches RENAME COLUMN "matchId" TO match_id;
ALTER TABLE matches RENAME COLUMN "queueId" TO queue_id;

# Verify the fix
\d matches

# Exit
\q
```

### Step 2: Regenerate Prisma Client

```bash
cd ~/League_Comms/apps/api
npm run prisma:generate
```

### Step 3: Restart API Server

Stop your current server (Ctrl+C) and restart:

```bash
npm run dev
```

### Step 4: Re-run Batch Seeding

```bash
curl -X POST "http://192.168.0.159:4000/champions/seed/batch?region=na1"
```

## Alternative: Reset Database (If You Don't Mind Losing Data)

If you want to start completely fresh:

```bash
cd ~/League_Comms/apps/api
npx prisma migrate reset
# This will ask: "Are you sure you want to reset your database? All data will be lost."
# Type: y
```

Then restart seeding.

## Verify It's Fixed

After fixing, check your API server logs. You should see:
- ✅ No more "column m.match_id does not exist" errors
- ✅ Aggregation running successfully
- ✅ Matches being ingested
