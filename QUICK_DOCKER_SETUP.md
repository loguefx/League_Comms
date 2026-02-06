# Quick Docker Backend Setup

## Prerequisites
- Docker Desktop installed and running
- Docker whale icon in system tray should be steady (not animating)

## One-Command Setup

```powershell
# From project root
cd infra
docker-compose up -d
```

This starts:
- ✅ PostgreSQL (database) on port 5432
- ✅ Redis (cache) on port 6379  
- ✅ LiveKit (voice server) on port 7880

## Verify It's Working

```powershell
# Check containers are running
docker ps

# Check logs if something's wrong
docker-compose logs

# Stop everything
docker-compose down

# Restart
docker-compose restart
```

## Set Up Database

After Docker is running:

```powershell
cd ..\apps\api
npm run prisma:migrate
```

This creates all the database tables.

## Start API Server

```powershell
# In a new terminal
cd apps\api
npm run dev
```

API will be at: http://localhost:4000

## Check API Health

```powershell
Invoke-WebRequest http://localhost:4000/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## Full Stack Now Running

- ✅ Docker services (PostgreSQL, Redis, LiveKit)
- ✅ API server (port 4000)
- ✅ Web app (port 3000) - already running!

## Troubleshooting

### Docker not starting?
- Make sure Docker Desktop is running
- Check Windows features: WSL 2 or Hyper-V enabled
- Restart Docker Desktop

### Port already in use?
```powershell
# Find what's using port 5432, 6379, or 7880
netstat -ano | findstr ":5432 :6379 :7880"
```

### Database connection error?
- Make sure PostgreSQL container is running: `docker ps`
- Check logs: `docker-compose logs postgres`
- Wait a few seconds after starting - containers need time to initialize
