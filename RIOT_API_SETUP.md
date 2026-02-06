# How to Configure Riot API Credentials

## Overview

You need **3 credentials** from Riot Games to use this application:
1. **Client ID** - For Riot Sign On (RSO) OAuth
2. **Client Secret** - For Riot Sign On (RSO) OAuth
3. **API Key** - For accessing Riot API endpoints (match data, summoner info, etc.)

## Step 1: Get Riot API Credentials

### 1.1 Go to Riot Developer Portal

Visit: **https://developer.riotgames.com/**

### 1.2 Sign In

- Sign in with your Riot account (the same account you use for League of Legends)

### 1.3 Create an Application

1. Click **"Register"** or **"My Apps"** in the top menu
2. Click **"Create New App"** or **"Register New Application"**
3. Fill out the application form:
   - **App Name**: League Voice Companion (or any name you want)
   - **Description**: Companion app for League of Legends voice communication
   - **Redirect URIs**: Add `http://localhost:4000/auth/riot/callback`
   - **Scopes**: Select the scopes you need (usually `openid`, `profile`, `offline_access`)

### 1.4 Get Your Credentials

After creating the app, you'll see:
- **Client ID** - Copy this
- **Client Secret** - Copy this (you may need to click "Show" to reveal it)
- **API Key** - This is usually on a separate page (look for "API Keys" or "Development Key")

**Note**: For development, you can use a **Development API Key** which has higher rate limits but expires after 24 hours. For production, you'll need a **Production API Key**.

## Step 2: Add Credentials to Your .env File

### 2.1 Open the .env File

**On Linux:**
```bash
cd ~/League_Comms/apps/api
nano .env
```

**On Windows:**
```powershell
cd apps\api
notepad .env
```

### 2.2 Find the Riot API Section

Look for these lines:
```env
# Riot API - GET FROM https://developer.riotgames.com/
RIOT_CLIENT_ID=your-riot-client-id-here
RIOT_CLIENT_SECRET=your-riot-client-secret-here
RIOT_API_KEY=your-riot-api-key-here
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback
```

### 2.3 Replace with Your Credentials

```env
# Riot API - GET FROM https://developer.riotgames.com/
RIOT_CLIENT_ID=your-actual-client-id-here
RIOT_CLIENT_SECRET=your-actual-client-secret-here
RIOT_API_KEY=your-actual-api-key-here
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback
```

**Example:**
```env
RIOT_CLIENT_ID=abc123xyz789
RIOT_CLIENT_SECRET=secret_key_here_do_not_share
RIOT_API_KEY=RGAPI-12345678-90ab-cdef-ghij-klmnopqrstuv
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback
```

### 2.4 Save the File

**In nano (Linux):**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

**In notepad (Windows):**
- Press `Ctrl + S`
- Close the window

## Step 3: Verify Configuration

### 3.1 Restart the API Server

If the API is running, restart it:

```bash
# Stop the server (Ctrl+C)
# Then start again
cd ~/League_Comms
npm run dev
```

### 3.2 Test the Configuration

1. Open your browser to: `http://localhost:3000`
2. Try to log in with Riot
3. If you see an OAuth redirect to Riot, your credentials are working!

## What Each Credential Does

| Credential | Purpose | Used For |
|------------|---------|----------|
| **RIOT_CLIENT_ID** | OAuth Client ID | Riot Sign On (RSO) authentication flow |
| **RIOT_CLIENT_SECRET** | OAuth Client Secret | Exchanging authorization codes for tokens |
| **RIOT_API_KEY** | API Key | Fetching match data, summoner info, live game data |
| **RIOT_REDIRECT_URI** | OAuth Redirect | Where Riot sends users after authentication |

## Troubleshooting

### Error: "Invalid client credentials"
- Check that `RIOT_CLIENT_ID` and `RIOT_CLIENT_SECRET` match your app in the Riot Developer Portal
- Make sure there are no extra spaces or quotes around the values

### Error: "Invalid API key"
- Your `RIOT_API_KEY` may have expired (Development keys expire after 24 hours)
- Get a new API key from the Riot Developer Portal
- Make sure you're using the correct region's API key

### Error: "Redirect URI mismatch"
- Make sure `RIOT_REDIRECT_URI` in your `.env` matches exactly what you registered in the Riot Developer Portal
- Default should be: `http://localhost:4000/auth/riot/callback`

### API Rate Limits
- Development keys have higher rate limits (100 requests per 2 minutes)
- Production keys have lower limits (100 requests per 2 minutes per endpoint)
- The app includes rate limiting to prevent exceeding limits

## Security Notes

⚠️ **IMPORTANT**: Never commit your `.env` file to Git!

- The `.env` file is already in `.gitignore`
- Never share your `RIOT_CLIENT_SECRET` or `RIOT_API_KEY` publicly
- If you accidentally commit credentials, revoke them in the Riot Developer Portal and create new ones

## Next Steps

After configuring Riot API credentials:

1. ✅ Restart the API server
2. ✅ Test Riot OAuth login at `http://localhost:3000`
3. ✅ Try fetching your match history
4. ✅ Test live game detection

## Need Help?

- Riot Developer Portal: https://developer.riotgames.com/
- Riot API Documentation: https://developer.riotgames.com/docs/portal
- RSO (Riot Sign On) Documentation: https://developer.riotgames.com/docs/riot-account/riot-sign-on
