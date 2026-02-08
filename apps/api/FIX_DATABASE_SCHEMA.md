# Fix Database Schema Mismatch

If you're getting the error: `The column 'matches.matchId' does not exist in the current database`

This means your PostgreSQL database schema doesn't match the Prisma schema. Follow these steps:

## Step 1: Regenerate Prisma Client

```bash
cd apps/api
npx prisma generate
```

## Step 2: Check Your Database Schema

Connect to your PostgreSQL database and verify the column names:

```sql
-- Connect to your database
psql -U postgres -d LVC

-- Check the matches table structure
\d matches
```

You should see `match_id` (snake_case), not `matchId` (camelCase).

## Step 3: Run Migrations

If the schema is wrong, you need to create and run a migration:

```bash
cd apps/api
npx prisma migrate dev --name fix_match_column_names
```

## Step 4: If Migrations Fail - Manual Fix

If migrations fail because the table already exists with wrong column names, you can manually fix it:

```sql
-- Connect to your database
psql -U postgres -d LVC

-- If you have camelCase columns, rename them to snake_case
ALTER TABLE matches RENAME COLUMN "matchId" TO match_id;
ALTER TABLE matches RENAME COLUMN "queueId" TO queue_id;
ALTER TABLE matches RENAME COLUMN "gameStartTs" TO game_start_ts;
ALTER TABLE matches RENAME COLUMN "durationS" TO duration_s;
ALTER TABLE matches RENAME COLUMN "gameVersion" TO game_version;
ALTER TABLE matches RENAME COLUMN "rankBracket" TO rank_bracket;
ALTER TABLE matches RENAME COLUMN "processedAt" TO processed_at;
```

Then regenerate Prisma client:

```bash
cd apps/api
npx prisma generate
```

## Step 5: Restart Your Server

After fixing the schema, restart your dev server:

```bash
npm run dev
```
