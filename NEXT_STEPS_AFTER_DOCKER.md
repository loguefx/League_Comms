# Next Steps After Docker is Running

## ✅ Docker is Running!

All containers are up:
- ✅ `league-voice-postgres` (Database)
- ✅ `league-voice-redis` (Cache)
- ✅ `league-voice-livekit` (Voice server)

## Step 1: Verify Containers

```bash
# Check all containers are running
docker ps
```

You should see all 3 containers with status "Up".

## Step 2: Setup Database

```bash
# Go to project root
cd ~/League_Comms

# Generate Prisma client
cd apps/api
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
cd ../..
```

## Step 3: Configure Environment

```bash
# Edit .env file with your Riot API credentials
nano apps/api/.env
```

Add your credentials from https://developer.riotgames.com/:
- `RIOT_CLIENT_ID`
- `RIOT_CLIENT_SECRET`
- `RIOT_API_KEY`

## Step 4: Start Development Servers

```bash
# From project root
npm run dev
```

This starts:
- API server: http://localhost:4000
- Web app: http://localhost:3000

## Complete Command Sequence

```bash
# 1. Verify Docker
docker ps

# 2. Setup database
cd ~/League_Comms/apps/api
npm run prisma:generate
npm run prisma:migrate
cd ../..

# 3. Configure .env
nano apps/api/.env
# Add Riot API credentials

# 4. Start development
npm run dev
```

## Verify Everything Works

### Check API Health
```bash
curl http://localhost:4000/health
```

Should return: `{"status":"ok",...}`

### Open Web App
```bash
xdg-open http://localhost:3000
# or
firefox http://localhost:3000
```

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check logs
docker compose logs postgres
```

### Prisma Migration Fails
```bash
# Make sure Docker is running
docker ps

# Try again
cd apps/api
npm run prisma:migrate
```

### Port Already in Use
```bash
# Find what's using the port
sudo lsof -i :4000
sudo lsof -i :3000

# Kill the process if needed
kill -9 <PID>
```

## Success!

Once `npm run dev` is running, you should see:
- API server running on port 4000
- Web app running on port 3000
- All Docker containers running

Then you can:
1. Open http://localhost:3000 in your browser
2. Go to Settings
3. Connect your Riot account
4. Test the app!
