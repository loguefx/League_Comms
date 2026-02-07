# Fix Prisma Client Not Initialized

## The Problem
Error: `@prisma/client did not initialize yet. Please run "prisma generate"`

## Quick Fix

### Step 1: Navigate to API Directory

```bash
cd ~/League_Comms/apps/api
```

### Step 2: Generate Prisma Client

```bash
npm run prisma:generate
```

Or directly:

```bash
npx prisma generate
```

### Step 3: Run Database Migrations (if needed)

```bash
npm run prisma:migrate
```

Or:

```bash
npx prisma migrate dev
```

### Step 4: Start Dev Again

```bash
cd ~/League_Comms
npm run dev
```

## Complete Setup Sequence

If you're setting up fresh:

```bash
# 1. Navigate to API
cd ~/League_Comms/apps/api

# 2. Generate Prisma client
npm run prisma:generate

# 3. Run migrations (creates database)
npm run prisma:migrate

# 4. Go back to root
cd ~/League_Comms

# 5. Start dev
npm run dev
```

## What This Does

- `prisma:generate` - Generates the Prisma client code from `schema.prisma`
- `prisma:migrate` - Creates the database file (`dev.db` for SQLite) and applies migrations

## Note

If using Docker with PostgreSQL, make sure Docker is running and the database is up before running migrations.
