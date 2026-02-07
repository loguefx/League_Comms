# Simple Migration Steps

## You're Currently In: `apps/api`

### Step 1: Run Migration

```bash
npm run prisma:migrate
```

Wait for it to complete.

### Step 2: Go Back to Root

```bash
cd ../..
```

### Step 3: Configure .env (If Needed)

```bash
nano apps/api/.env
```

Add your Riot API credentials.

### Step 4: Start Development

```bash
npm run dev
```

## That's It!

Your app should start running.

## If Migration Fails

Check Docker is running:

```bash
docker ps
```

Should show all 3 containers running.

## Success Looks Like

After `npm run prisma:migrate`, you should see:
```
✅ Applied migration: ...
```

Then you can continue with setup.
