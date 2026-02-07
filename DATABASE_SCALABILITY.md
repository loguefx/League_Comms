# Database Scalability: SQLite vs PostgreSQL

## TL;DR

**For 500,000+ players in production: Use PostgreSQL**

SQLite is fine for:
- ✅ Development/testing
- ✅ Small deployments (< 100 concurrent users)
- ✅ Read-heavy workloads

PostgreSQL is required for:
- ✅ Production with 500,000+ users
- ✅ Multiple concurrent writes
- ✅ High-traffic web applications
- ✅ Better performance under load

## SQLite Limitations

### 1. **Single Writer Lock**
- SQLite uses **database-level locking**
- Only **one write operation** can happen at a time
- Concurrent writes will queue and slow down

**Impact:** If 10 users try to link their Riot account simultaneously, they'll wait in line.

### 2. **File-Based Storage**
- Database is a single file on disk
- Network access is slower
- No built-in replication

**Impact:** Slower performance, especially over network mounts.

### 3. **Limited Concurrency**
- Can handle **thousands of reads** simultaneously
- Can handle **only 1 write** at a time
- Web apps need many concurrent writes (sessions, updates, etc.)

**Impact:** Your API will slow down as more users use it simultaneously.

## PostgreSQL Advantages

### 1. **Row-Level Locking**
- Multiple writes can happen simultaneously
- Much better for concurrent web requests

### 2. **Better Performance**
- Optimized for multi-user scenarios
- Better query optimization
- Handles complex queries better

### 3. **Production-Ready Features**
- Replication for high availability
- Better backup/restore
- Advanced indexing options
- Full-text search

## When to Use Each

### Use SQLite When:
- ✅ Local development
- ✅ Testing
- ✅ Small personal projects
- ✅ < 100 concurrent users
- ✅ Read-heavy workloads

### Use PostgreSQL When:
- ✅ Production deployment
- ✅ 500,000+ users
- ✅ Multiple concurrent writes
- ✅ High-traffic applications
- ✅ Need for scalability

## Current Setup

Your project supports **both** databases:

1. **SQLite** (default for development)
   - No Docker needed
   - File: `apps/api/dev.db`
   - Configured in `schema.prisma`

2. **PostgreSQL** (recommended for production)
   - Requires Docker or external database
   - Configured via `DATABASE_URL` in `.env`

## How to Switch to PostgreSQL

### Option 1: Using Docker (Recommended)

1. **Update `.env` file:**
```env
# Change from SQLite:
# DATABASE_URL="file:./dev.db"

# To PostgreSQL:
DATABASE_URL="postgresql://league_voice:league_voice_dev@localhost:5432/league_voice?schema=public"
```

2. **Start PostgreSQL with Docker:**
```bash
docker-compose up -d postgres
```

3. **Update Prisma schema:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

4. **Run migrations:**
```bash
cd apps/api
npm run prisma:migrate
```

### Option 2: External PostgreSQL

1. **Get PostgreSQL connection string** from your provider (AWS RDS, Heroku, etc.)

2. **Update `.env`:**
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

3. **Update schema and migrate** (same as above)

## Performance Comparison

### SQLite (500,000 users)
- ✅ Can store all records
- ❌ Slow concurrent writes (1 at a time)
- ❌ API will slow down under load
- ❌ Not ideal for production

### PostgreSQL (500,000 users)
- ✅ Can store all records
- ✅ Fast concurrent writes (many at once)
- ✅ API stays fast under load
- ✅ Production-ready

## Migration Path

1. **Start with SQLite** for development
2. **Test with PostgreSQL** locally using Docker
3. **Deploy PostgreSQL** for production
4. **Migrate data** from SQLite to PostgreSQL if needed

## Recommendation

For **500,000+ players**, you should:

1. ✅ **Use PostgreSQL in production**
2. ✅ **Keep SQLite for local development** (optional)
3. ✅ **Set up PostgreSQL with Docker** for easy deployment
4. ✅ **Use connection pooling** (Prisma handles this)

## Quick Start: PostgreSQL Setup

```bash
# 1. Update .env
DATABASE_URL="postgresql://league_voice:league_voice_dev@localhost:5432/league_voice?schema=public"

# 2. Start PostgreSQL
docker-compose up -d postgres

# 3. Update schema.prisma
# Change provider from "sqlite" to "postgresql"

# 4. Run migrations
cd apps/api
npm run prisma:migrate

# 5. Restart API
npm run dev
```

## Conclusion

**SQLite will work** for 500,000 records, but **PostgreSQL is required** for a production web application with that many users. The concurrent write limitation of SQLite will cause performance issues as your user base grows.
