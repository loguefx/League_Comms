# Fix P3019 Migration Error - Quick Guide

## The Problem
```
Error: P3019
The datasource provider 'postgresql' specified in your schema does not match 
the one specified in the migration_lock.toml, 'sqlite'.
```

## The Solution (Run These Commands)

**On Ubuntu/Linux:**
```bash
cd ~/League_Comms/apps/api
rm -rf prisma/migrations
rm -f prisma/migration_lock.toml
npm run prisma:migrate
```

**Step by step:**
1. Navigate to the API directory
2. Remove the old SQLite migrations
3. Remove the migration lock file
4. Create new PostgreSQL migrations

## What This Does

- **Removes old migrations**: Deletes the SQLite migration history
- **Removes lock file**: Deletes the file that tracks which database provider was used
- **Creates new migrations**: Generates fresh migrations for PostgreSQL

## After Running

When you run `npm run prisma:migrate`, Prisma will:
1. Ask for a migration name (e.g., "init_postgres")
2. Generate the migration SQL
3. Apply it to your PostgreSQL database

If Prisma asks about resetting the database:
- **Type "n" (No)** if you want to keep existing data
- **Type "y" (Yes)** only if you want to start completely fresh

## Verify It Worked

After migration completes, you should see:
- ✅ New `prisma/migrations/` directory with PostgreSQL migrations
- ✅ New `prisma/migration_lock.toml` with `provider = "postgresql"`
- ✅ All tables created in your PostgreSQL database
