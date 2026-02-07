# Quick Next Steps - Docker is Running! ✅

## You're Almost Done!

Docker containers are running. Now finish setup:

## Step 1: Setup Database

```bash
cd ~/League_Comms/apps/api
npm run prisma:generate
npm run prisma:migrate
cd ../..
```

## Step 2: Add Riot API Credentials

```bash
nano apps/api/.env
```

Get credentials from: https://developer.riotgames.com/

## Step 3: Start Development

```bash
npm run dev
```

## That's It!

Your app will be running at:
- Web: http://localhost:3000
- API: http://localhost:4000

## Verify

```bash
# Check API
curl http://localhost:4000/health

# Open web app
xdg-open http://localhost:3000
```
