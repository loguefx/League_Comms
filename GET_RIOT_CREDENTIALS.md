# How to Get Riot Client ID, Client Secret, and API Key

## Step-by-Step Guide

### Step 1: Go to Riot Developer Portal

Visit: **https://developer.riotgames.com/**

### Step 2: Sign In

- Click **"Sign In"** in the top right
- Sign in with your **Riot account** (the same account you use for League of Legends)
- If you don't have a Riot account, create one first

### Step 3: Register Your Application

1. Once signed in, look for **"My Apps"** or **"Register"** in the top menu
2. Click **"Register New Application"** or **"Create New App"**
3. Fill out the application form:

   **Application Details:**
   - **App Name**: `League Voice Companion` (or any name you want)
   - **Description**: `Companion app for League of Legends voice communication and stats`
   - **App Type**: Select **"Web Application"** or **"Desktop Application"**
   - **Redirect URIs**: Add this:
     ```
     http://localhost:4000/auth/riot/callback
     ```
     (For production, you'll add your production URL later)

   **Scopes** (Permissions):
   - Select the scopes you need:
     - `openid` (required)
     - `profile` (to get user info)
     - `offline_access` (to get refresh tokens)

4. Click **"Register"** or **"Create Application"**

### Step 4: Get Your Credentials

After creating the app, you'll see your application dashboard. Here's what to look for:

#### Client ID
- Usually displayed prominently on the dashboard
- Looks like: `abc123xyz789` or a UUID
- **Copy this** - this is your `RIOT_CLIENT_ID`

#### Client Secret
- May be hidden initially (click **"Show"** or **"Reveal"** to see it)
- Looks like: `secret_key_here_do_not_share`
- **Copy this immediately** - this is your `RIOT_CLIENT_SECRET`
- ⚠️ **Important**: You can only see this once! Save it somewhere safe.

#### API Key
- Look for **"API Keys"** or **"Development Key"** section
- For development, you can use a **Development API Key** (expires after 24 hours)
- For production, you'll need a **Production API Key** (doesn't expire, but requires approval)
- **Copy this** - this is your `RIOT_API_KEY`

### Step 5: Add Credentials to Your .env File

```bash
cd ~/League_Comms/apps/api
nano .env
```

Find these lines and replace with your actual values:

```env
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

Save: `Ctrl+X`, then `Y`, then `Enter`

## Visual Guide

### Where to Find Each Credential

1. **Client ID**: 
   - Usually at the top of your app dashboard
   - Labeled as "Client ID" or "Application ID"

2. **Client Secret**:
   - On the same dashboard, below Client ID
   - May be hidden - click "Show" or "Reveal"
   - ⚠️ Copy it immediately - you might only see it once!

3. **API Key**:
   - Look for "API Keys" tab or section
   - Click "Create Development Key" or "Get API Key"
   - Copy the key that appears

## Important Notes

### Development vs Production

**For Development (Testing):**
- Use **Development API Key** (expires after 24 hours)
- You'll need to get a new one daily
- Good for testing and development

**For Production (Release):**
- Request a **Production API Key** (doesn't expire)
- May require Riot approval
- Use this when you release your app

### Security

⚠️ **Never commit these to Git!**
- The `.env` file is already in `.gitignore`
- Never share your Client Secret publicly
- If you accidentally expose it, revoke it in the Developer Portal and create a new one

### Redirect URI Must Match Exactly

The redirect URI in your `.env` file **must match exactly** what you registered in the Developer Portal:
- `http://localhost:4000/auth/riot/callback` ✅
- `http://localhost:4000/auth/riot/callback/` ❌ (trailing slash)
- `http://localhost:4000/auth/riot/callback ` ❌ (extra space)

## Troubleshooting

### "Invalid client credentials"
- Double-check Client ID and Client Secret
- Make sure there are no extra spaces
- Make sure you copied the entire value

### "Redirect URI mismatch"
- Check that the redirect URI in `.env` matches exactly what's in the Developer Portal
- No trailing slashes, no extra spaces

### "Invalid API key"
- Development keys expire after 24 hours - get a new one
- Make sure you copied the entire key
- Check for extra spaces or line breaks

### Can't find Client Secret
- Some apps hide it after first view
- Look for "Reveal" or "Show" button
- If you can't find it, you may need to regenerate it (this will invalidate the old one)

## Quick Checklist

- [ ] Signed in to https://developer.riotgames.com/
- [ ] Created a new application
- [ ] Added redirect URI: `http://localhost:4000/auth/riot/callback`
- [ ] Copied Client ID
- [ ] Copied Client Secret (saved it somewhere safe!)
- [ ] Got API Key (Development or Production)
- [ ] Added all three to `apps/api/.env`
- [ ] Verified no extra spaces or typos

## Next Steps

After adding your credentials:

1. **Save the .env file**
2. **Restart your API server** (if it's running)
3. **Test the OAuth flow** by visiting: `http://localhost:4000/auth/riot/start`
4. You should be redirected to Riot's login page!

## Need Help?

- Riot Developer Portal: https://developer.riotgames.com/
- Riot API Documentation: https://developer.riotgames.com/docs/portal
- RSO (Riot Sign On) Docs: https://developer.riotgames.com/docs/riot-account/riot-sign-on
