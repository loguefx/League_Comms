# Start Redis on Linux (Ubuntu)

## Quick Fix for Redis Connection Error

Your app needs Redis running. Here's how to start it:

## Option 1: Start Redis with Docker (Recommended)

```bash
# Navigate to infra directory
cd ~/League_Comms/infra

# Start Redis
docker compose up -d redis

# Verify it's running
docker ps | grep redis

# Test Redis connection
docker exec league-voice-redis redis-cli ping
# Should return: PONG
```

## Option 2: Start All Docker Services

If you want to start all services (PostgreSQL, Redis, LiveKit):

```bash
cd ~/League_Comms/infra
docker compose up -d
```

## Option 3: Install and Run Redis Locally (Without Docker)

```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server

# Enable Redis to start on boot
sudo systemctl enable redis-server

# Verify it's running
redis-cli ping
# Should return: PONG
```

## After Starting Redis

Go back to your project root and restart the dev server:

```bash
cd ~/League_Comms
npm run dev
```

The Redis connection errors should be gone!

## Check Redis Status

```bash
# Check if Redis container is running (Docker)
docker ps | grep redis

# Check if Redis service is running (local)
sudo systemctl status redis-server

# Test connection
redis-cli ping
```

## If You Still Get Errors

Make sure your `.env` file has:
```env
USE_REDIS=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

Or if using Docker and Redis is in a container, you might need:
```env
USE_REDIS=true
REDIS_HOST=localhost  # or the container name if networking is different
REDIS_PORT=6379
```
