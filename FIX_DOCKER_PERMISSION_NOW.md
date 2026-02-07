# Fix Docker Permission - Quick Fix

## The Error
```
permission denied while trying to connect to the Docker daemon socket
```

## Quick Fix

### Step 1: Add Yourself to Docker Group

```bash
# Add user to docker group
sudo usermod -aG docker $USER
```

### Step 2: Activate Docker Group

```bash
# Activate docker group (or log out and back in)
newgrp docker
```

### Step 3: Verify Docker Works

```bash
# Test Docker (should NOT need sudo)
docker ps
```

If this works without `sudo`, you're good!

### Step 4: Try Docker Compose Again

```bash
# You're already in infra directory, so just run:
docker compose up -d
```

Or if you need to go there:

```bash
cd ~/League_Comms/infra
docker compose up -d
```

## Complete Command Sequence

```bash
# 1. Add to docker group
sudo usermod -aG docker $USER

# 2. Activate group
newgrp docker

# 3. Verify
docker ps

# 4. Start Docker services
cd ~/League_Comms/infra
docker compose up -d
```

## If newgrp Doesn't Work

If `newgrp docker` doesn't work, log out and back in:

1. Close terminal
2. Log out of Ubuntu
3. Log back in
4. Open terminal
5. Try `docker ps` (should work without sudo)

## After Docker Starts

Once Docker services are running:

```bash
# Check containers are running
docker ps

# Should see:
# - league-voice-postgres
# - league-voice-redis  
# - league-voice-livekit
```

Then continue with setup:

```bash
cd ~/League_Comms
cd apps/api
npm run prisma:generate
npm run prisma:migrate
cd ../..
npm run dev
```
