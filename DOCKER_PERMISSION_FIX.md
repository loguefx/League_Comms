# Docker Permission Denied - Fix

## Current Situation
You're in `~/League_Comms/infra` and getting Docker permission errors.

## Fix Steps

### Option 1: Quick Fix (Recommended)

```bash
# Add yourself to docker group
sudo usermod -aG docker $USER

# Activate docker group
newgrp docker

# Verify it works
docker ps

# Now start Docker services
docker compose up -d
```

### Option 2: Use Sudo (Temporary)

```bash
# Use sudo for now (not ideal, but works)
sudo docker compose up -d
```

**Note:** Using `sudo` is not recommended long-term. Fix permissions properly with Option 1.

## Verify Docker Group

Check if you're in the docker group:

```bash
groups
```

You should see `docker` in the list. If not, run:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

## After Docker Starts

Check containers:

```bash
docker ps
```

You should see 3 containers running:
- `league-voice-postgres`
- `league-voice-redis`
- `league-voice-livekit`

## Continue Setup

After Docker is running:

```bash
# Go back to project root
cd ~/League_Comms

# Setup database
cd apps/api
npm run prisma:generate
npm run prisma:migrate
cd ../..

# Start development
npm run dev
```
