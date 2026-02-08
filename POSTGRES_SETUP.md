# PostgreSQL Database Setup

## ✅ What We've Done

1. **Updated Prisma Schema**: Changed from SQLite to PostgreSQL
   - File: `apps/api/prisma/schema.prisma`
   - Uses PostgreSQL-specific types (Json instead of String)

2. **Updated .env File**: Set DATABASE_URL to PostgreSQL
   - Connection: `postgresql://postgres:Raymond7681@localhost:5432/LVC?schema=public`
   - Database: `LVC`
   - User: `postgres`
   - Password: `Raymond7681`
   - Port: `5432`

3. **Generated Prisma Client**: ✅ Completed

## 🔧 Next Steps

### 1. Start PostgreSQL Server

Make sure PostgreSQL is running. You can check by:
- Opening pgAdmin or your PostgreSQL admin tool
- Or checking if the service is running in Windows Services

### 2. Create the Database (if it doesn't exist)

If the `LVC` database doesn't exist yet, create it:

**Option A: Using pgAdmin**
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click "Databases" → "Create" → "Database"
4. Name: `LVC`
5. Click "Save"

**Option B: Using psql command line**
```bash
psql -U postgres
CREATE DATABASE LVC;
\q
```

### 3. Run Database Migrations

Once PostgreSQL is running and the database exists:

```bash
cd apps/api
npm run prisma:migrate
```

This will create all the tables:
- `User`
- `RiotAccount`
- `Session`
- `VoiceRoom`
- `RoomMember`
- `UserSettings`
- `Match` ← **For storing match data**
- `MatchParticipant` ← **For storing participant data**
- `ChampionRankAgg` ← **For aggregated champion statistics**

### 4. Verify Connection

Test the connection:
```bash
cd apps/api
npm run prisma:studio
```

This opens Prisma Studio where you can view your database.

### 5. Restart API Server

After migrations complete, restart your API server:
```bash
npm run dev
```

## 🎯 After Setup: Populate Champion Data

Once the database is set up, you can start populating it with champion data:

### Option 1: Batch Seed (Recommended)
```bash
# Via API endpoint (after server is running)
curl -X POST http://localhost:4000/champions/seed/batch

# Or check progress
curl http://localhost:4000/champions/progress
```

### Option 2: Manual Test
```bash
# Test API endpoints work
node scripts/test-riot-apis.js
```

## 📊 Database Schema for Champions

The key tables for champion statistics:

**Match** - Stores raw match data
- `matchId` (unique)
- `region`
- `patch` (e.g., "16.3")
- `gameMode`

**MatchParticipant** - Stores individual player data from matches
- `championId`
- `role` (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY)
- `rankTier` (IRON, BRONZE, etc.)
- `won` (boolean)

**ChampionRankAgg** - Pre-aggregated statistics (like U.GG)
- `rankTier` + `championId` + `role` + `patch` (unique)
- `matches` (count)
- `wins` (count)
- Win rate = `wins / matches`

## 🔍 Troubleshooting

### Error: "Can't reach database server"
- Make sure PostgreSQL is running
- Check if port 5432 is accessible
- Verify firewall settings

### Error: "Database LVC does not exist"
- Create the database first (see step 2 above)

### Error: "Password authentication failed"
- Verify password is correct: `Raymond7681`
- Check if user `postgres` exists

### Connection works but migrations fail
- Make sure you're in the `apps/api` directory
- Check that `DATABASE_URL` in `.env` is correct
- Try: `npx prisma migrate dev --name init_postgres`
