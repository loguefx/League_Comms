# Fix "column m.match_id does not exist" Error

## The Problem

The aggregation service is failing with:
```
Error: column m.match_id does not exist
```

This happens because Prisma created the columns with camelCase names (`matchId`, `queueId`) but the SQL queries expect snake_case (`match_id`, `queue_id`).

## Solution

### Option 1: Reset Database (If Data is Not Important)

If your database is mostly empty or you don't mind losing data:

```bash
cd apps/api
# Reset the database
npx prisma migrate reset
# This will drop all tables and recreate them with correct column names
```

### Option 2: Fix Column Names Manually (Keep Data)

If you want to keep existing data, run this SQL script:

```bash
# Connect to your PostgreSQL database
psql -U postgres -d LVC

# Then run the SQL commands:
ALTER TABLE matches RENAME COLUMN "matchId" TO match_id;
ALTER TABLE matches RENAME COLUMN "queueId" TO queue_id;
```

Or use the provided script:

```bash
psql -U postgres -d LVC -f scripts/fix-column-names.sql
```

### Option 3: Create a Migration to Fix It

```bash
cd apps/api
# Create a new migration
npx prisma migrate dev --name fix_column_names --create-only

# Edit the migration file to rename columns:
# prisma/migrations/XXXXX_fix_column_names/migration.sql
# Add:
#   ALTER TABLE matches RENAME COLUMN "matchId" TO match_id;
#   ALTER TABLE matches RENAME COLUMN "queueId" TO queue_id;

# Apply the migration
npx prisma migrate deploy
```

## After Fixing

Once the column names are fixed:

1. **Restart your API server**
2. **Re-run batch seeding** (if needed):
   ```bash
   curl -X POST "http://192.168.0.159:4000/champions/seed/batch?region=na1"
   ```
3. **Aggregation should now work** - it runs automatically every 10 minutes

## Verify the Fix

Check that columns are correctly named:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'matches' 
ORDER BY column_name;
```

You should see `match_id` and `queue_id` (not `matchId` or `queueId`).
