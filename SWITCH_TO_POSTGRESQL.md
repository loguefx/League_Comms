# How to Switch from SQLite to PostgreSQL

## Quick Answer

**For 500,000+ players, you MUST use PostgreSQL in production.**

SQLite will cause performance issues due to single-writer locking.

## Step-by-Step Migration

### Step 1: Update `.env` File

In `apps/api/.env`, change:

```env
# FROM (SQLite):
DATABASE_URL="file:./dev.db"

# TO (PostgreSQL):
DATABASE_URL="postgresql://league_voice:league_voice_dev@localhost:5432/league_voice?schema=public"
```

### Step 2: Start PostgreSQL

If using Docker (recommended):

```bash
cd infra
docker-compose up -d postgres
```

Or use an external PostgreSQL database.

### Step 3: Switch Prisma Schema

**Option A: Replace schema file (recommended for production)**

```bash
cd apps/api
cp prisma/schema.postgresql.prisma prisma/schema.prisma
```

**Option B: Edit schema.prisma manually**

Change these lines:
```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")  // Changed from "file:./dev.db"
}
```

Also change `String` to `Json` for:
- `RiotAccount.encryptedTokens` → `Json`
- `UserSettings.privacyFlags` → `Json`
- `UserSettings.uiPrefs` → `Json`

### Step 4: Generate Prisma Client

```bash
cd apps/api
npm run prisma:generate
```

### Step 5: Run Migrations

```bash
cd apps/api
npm run prisma:migrate
```

This will:
- Create all tables in PostgreSQL
- Set up indexes
- Be ready for production

### Step 6: Restart API Server

```bash
cd apps/api
npm run dev
```

## Verify It Works

1. Check API logs - should connect to PostgreSQL
2. Try linking a Riot account - should work
3. Check database:
   ```bash
   docker exec -it league_voice_postgres psql -U league_voice -d league_voice
   \dt  # List tables
   \q   # Exit
   ```

## Data Migration (If Needed)

If you have existing SQLite data:

1. **Export from SQLite:**
   ```bash
   sqlite3 apps/api/dev.db .dump > backup.sql
   ```

2. **Import to PostgreSQL:**
   - Use a migration tool or manual import
   - Or start fresh (recommended for development)

## Performance Benefits

After switching to PostgreSQL:
- ✅ Multiple concurrent writes (no more queuing)
- ✅ Faster queries under load
- ✅ Better for 500,000+ users
- ✅ Production-ready

## Keep SQLite for Development?

You can keep SQLite for local development and use PostgreSQL for production:

1. Use `schema.sqlite.prisma` for local dev
2. Use `schema.postgresql.prisma` for production
3. Switch between them as needed

## Troubleshooting

**Error: "relation does not exist"**
- Run migrations: `npm run prisma:migrate`

**Error: "connection refused"**
- Check PostgreSQL is running: `docker ps`
- Check connection string in `.env`

**Error: "password authentication failed"**
- Verify PostgreSQL credentials in `docker-compose.yml` and `.env` match

## Summary

For **500,000+ players**, PostgreSQL is **required**. SQLite will work but will cause performance issues as concurrent users increase.
