# Reset Migrations for PostgreSQL

## Problem

When switching from SQLite to PostgreSQL, you may encounter this error:

```
Error: P3019
The datasource provider 'postgresql' specified in your schema does not match 
the one specified in the migration_lock.toml, 'sqlite'.
```

This happens because the old SQLite migration history conflicts with the new PostgreSQL schema.

## Solution

Remove the old migration directory and start fresh with PostgreSQL migrations.

### Option 1: Using the Script (Recommended)

**On Linux/Mac:**
```bash
cd ~/League_Comms
bash scripts/reset-migrations-for-postgres.sh
```

**On Windows (PowerShell):**
```powershell
cd League_Comms
.\scripts\reset-migrations-for-postgres.ps1
```

### Option 2: Manual Reset

**On Linux/Mac:**
```bash
cd apps/api
rm -rf prisma/migrations
rm prisma/migration_lock.toml
```

**On Windows (PowerShell):**
```powershell
cd apps\api
Remove-Item -Recurse -Force prisma\migrations
Remove-Item -Force prisma\migration_lock.toml
```

**On Windows (Command Prompt):**
```cmd
cd apps\api
rmdir /s /q prisma\migrations
del prisma\migration_lock.toml
```

## After Resetting

Once you've removed the old migrations, create new ones for PostgreSQL:

```bash
cd apps/api
npm run prisma:migrate
```

This will:
1. Create a new migration history for PostgreSQL
2. Generate the migration SQL
3. Apply it to your PostgreSQL database

## Important Notes

- **This will delete your old migration history** - but that's fine since you're switching databases
- **Your database data is safe** - this only affects migration files, not the actual database
- **If you have existing data in PostgreSQL**, Prisma will detect it and may ask if you want to baseline the migration

## If You Have Existing Data

If your PostgreSQL database already has tables, Prisma may ask:

```
? We need to reset the PostgreSQL database "LVC" at "localhost:5432".
Do you want to continue? All data will be lost.
```

**Choose carefully:**
- **Yes** - Will drop all tables and recreate them (data will be lost)
- **No** - Will baseline the migration (keeps existing data, marks it as already migrated)

If you want to keep existing data, choose "No" and Prisma will baseline the migration.
