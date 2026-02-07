# Fix Redis Connection Error (ECONNREFUSED)

## The Problem
Your app is trying to connect to Redis on port 6379, but Redis isn't running.

## Solution 1: Start Redis with Docker (Recommended)

### Step 1: Start Redis Container

```bash
cd infra
docker compose up -d redis
```

This will start Redis in the background.

### Step 2: Verify Redis is Running

```bash
# Check if Redis container is running
docker ps | grep redis

# Test Redis connection
docker exec league-voice-redis redis-cli ping
# Should return: PONG
```

### Step 3: Restart Your Dev Server

```bash
# Go back to project root
cd ..

# Restart dev server
npm run dev
```

## Solution 2: Disable Redis (Use In-Memory Cache)

If you don't want to use Redis, you can disable it:

### Step 1: Edit `.env` File

```bash
cd apps/api
nano .env
# or use your preferred editor
```

### Step 2: Set USE_REDIS to false

Make sure this line exists and is set to `false`:
```env
USE_REDIS=false
```

### Step 3: Restart Dev Server

```bash
cd ../..
npm run dev
```

**Note:** Even with `USE_REDIS=false`, BullMQ (the queue library) still tries to connect. You may need to start Redis anyway, or we can modify the code to make BullMQ optional.

## Solution 3: Start All Docker Services

If you want to start all services (PostgreSQL, Redis, LiveKit):

```bash
cd infra
docker compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- LiveKit on port 7880

## Quick Check Commands

```bash
# Check if Redis is running
docker ps | grep redis

# Check if port 6379 is in use
netstat -ano | findstr ":6379"  # Windows
# or
ss -tlnp | grep 6379  # Linux

# View Redis logs
docker logs league-voice-redis
```

## If Docker Isn't Installed

If you don't have Docker installed, you can:
1. Install Docker Desktop (Windows/Mac) or Docker Engine (Linux)
2. Or use Solution 2 to disable Redis (though BullMQ may still need it)
