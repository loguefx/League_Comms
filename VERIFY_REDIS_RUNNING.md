# Verify Redis is Running

## Check if Redis Container Started

After running `docker compose up -d redis`, verify it's running:

```bash
# Check if Redis container is running
docker ps | grep redis

# You should see something like:
# CONTAINER ID   IMAGE           ...   NAMES
# abc123def456   redis:7-alpine  ...   league-voice-redis
```

## Test Redis Connection

```bash
# Test if Redis is responding
docker exec league-voice-redis redis-cli ping

# Should return: PONG
```

## Check Redis Logs (if there are issues)

```bash
# View Redis container logs
docker logs league-voice-redis

# Follow logs in real-time
docker logs -f league-voice-redis
```

## If Redis Didn't Start

```bash
# Check what happened
docker compose ps

# Try starting again with logs visible
docker compose up redis

# Or check all services
docker compose ps -a
```

## After Redis is Running

Go back to your project root and restart the dev server:

```bash
cd ~/League_Comms
npm run dev
```

The Redis connection errors should be gone!

## Fix the Warning (Optional)

The warning about `version` being obsolete is harmless, but you can remove it:

Edit `infra/docker-compose.yml` and remove the first line:
```yaml
version: '3.8'  # Remove this line
```

Docker Compose v2 doesn't need the version field.
