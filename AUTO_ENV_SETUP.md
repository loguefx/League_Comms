# Automatic .env File Creation

## ✅ Now Automatic!

The `.env` file is now **automatically created** when you run setup scripts or manually.

## How It Works

### Option 1: Run Setup Script (Recommended)

**Linux:**
```bash
./setup-linux.sh
```

**Windows:**
```powershell
.\setup-windows.ps1
```

The setup script will automatically create `.env` with default values.

### Option 2: Manual Creation

You can also create it manually:

```bash
npm run create-env
```

Or directly:

```bash
node scripts/create-env.js
```

## What Gets Created

The script creates `apps/api/.env` with:
- ✅ All required environment variables
- ✅ Default values for development
- ✅ SQLite database (no Docker needed)
- ✅ In-memory Redis (no Docker needed)
- ✅ Placeholder values for Riot API credentials

## Next Steps

After the `.env` file is created:

1. **Edit `apps/api/.env`** and add your Riot API credentials:
   ```env
   RIOT_CLIENT_ID=your-actual-client-id
   RIOT_CLIENT_SECRET=your-actual-client-secret
   RIOT_API_KEY=your-actual-api-key
   ```

2. **Get credentials from**: https://developer.riotgames.com/

3. **See `RIOT_API_SETUP.md`** for detailed instructions

## The File Won't Be Overwritten

If `.env` already exists, the script **won't overwrite it**. It will just skip creation.

## For Production

See `PRODUCTION_SETUP.md` for:
- How this works for all users
- Production API key setup
- Deployment configuration
