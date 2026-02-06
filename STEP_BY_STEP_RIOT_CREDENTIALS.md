# Step-by-Step: Getting Riot Client ID and Client Secret

## Complete Walkthrough

### Step 1: Go to Riot Developer Portal

1. Open your browser
2. Go to: **https://developer.riotgames.com/**
3. Click **"Sign In"** (top right)
4. Sign in with your Riot account (same account you use for League of Legends)

### Step 2: Register Your Product (First Time)

1. After signing in, you'll see the Developer Portal dashboard
2. Look for one of these buttons:
   - **"Register"** (top menu)
   - **"My Apps"** → **"Register New Application"**
   - **"Create New Product"**
   - **"New Application"**

3. Click it to start the registration process

### Step 3: Fill Out the Product Registration Form

You'll see a form with these fields:

**Product Group:**
- Select **"Default Group"** (or create a new group if you want)

**Product URL:**
- Enter: `http://localhost:3000` (or your server IP like `http://192.168.1.100:3000`)

**Product Game Focus:**
- Select **"League of Legends"**

**reCAPTCHA:**
- Check the **"I'm not a robot"** box

4. Click **"NEXT"** or **"Continue"**

### Step 4: Configure Your Application

On the next page, you'll configure your app:

**Application Name:**
- Enter: `League Voice Companion` (or any name)

**Description:**
- Enter: `Companion app for League of Legends voice communication and stats`

**Application Type:**
- Select **"Web Application"** or **"Desktop Application"**

**Redirect URIs:**
- Click **"Add Redirect URI"** or **"+"**
- Enter: `http://localhost:4000/auth/riot/callback`
  - (Or `http://YOUR_SERVER_IP:4000/auth/riot/callback` if using server IP)

**Scopes (Permissions):**
- Check these boxes:
  - ✅ `openid` (required)
  - ✅ `profile` (to get user info)
  - ✅ `offline_access` (to get refresh tokens)

5. Click **"Register"**, **"Create"**, or **"Save"**

### Step 5: Find Your Credentials

After creating the application, you'll be taken to your **Application Dashboard** or **Application Details** page.

#### Finding Client ID

1. Look at the top of the page
2. You'll see a section labeled **"Client Information"** or **"Application Details"**
3. Find the field labeled **"Client ID"** or **"Application ID"**
4. It will look like: `abc123xyz789` or a long string
5. **Copy this entire value** - this is your `RIOT_CLIENT_ID`

#### Finding Client Secret

1. On the same page, look for **"Client Secret"** field
2. It might be:
   - **Hidden** (showing as dots: `••••••••`)
   - **Visible** (showing the actual value)

3. If hidden:
   - Look for a button: **"Show"**, **"Reveal"**, or an eye icon 👁️
   - Click it to reveal the secret
   - **Copy it immediately** - you might only see it once!

4. If visible:
   - Just copy it directly

5. The Client Secret looks like: `secret_key_here_do_not_share`
6. **This is your `RIOT_CLIENT_SECRET`**

### Step 6: Get Your API Key

The API Key is usually on a **different page** or **separate section**:

1. Look for one of these:
   - **"API Keys"** tab (at the top of the page)
   - **"Keys"** section in the sidebar
   - **"Development Key"** button
   - **"Get API Key"** link

2. Click it

3. You'll see options:
   - **"Development Key"** (expires in 24 hours - good for testing)
   - **"Production Key"** (doesn't expire - requires approval)

4. For now, click **"Create Development Key"** or **"Get Development Key"**

5. A key will appear, looking like: `RGAPI-12345678-90ab-cdef-ghij-klmnopqrstuv`
6. **Copy this** - this is your `RIOT_API_KEY`

## Visual Guide - What to Look For

### On the Application Dashboard:

```
┌─────────────────────────────────────┐
│ Application: League Voice Companion│
├─────────────────────────────────────┤
│ Client ID: abc123xyz789            │ ← Copy this
│ Client Secret: [Show] ••••••••     │ ← Click "Show", then copy
│                                     │
│ Redirect URIs:                      │
│ • http://localhost:4000/auth/...   │
└─────────────────────────────────────┘
```

### If You Can't Find Client Secret:

1. Look for a **"Settings"** or **"Edit"** button
2. Or look for **"Credentials"** section
3. Some portals show it only once when you first create the app
4. If you can't find it, you may need to **regenerate** it (this will invalidate the old one)

## Step 7: Add to Your .env File

Once you have all three:

1. Open your `.env` file:
   ```bash
   cd ~/League_Comms/apps/api
   nano .env
   ```

2. Find these lines:
   ```env
   RIOT_CLIENT_ID=your-riot-client-id-here
   RIOT_CLIENT_SECRET=your-riot-client-secret-here
   RIOT_API_KEY=your-riot-api-key-here
   ```

3. Replace with your actual values:
   ```env
   RIOT_CLIENT_ID=abc123xyz789
   RIOT_CLIENT_SECRET=secret_key_you_copied
   RIOT_API_KEY=RGAPI-12345678-90ab-cdef-ghij-klmnopqrstuv
   ```

4. Save: `Ctrl+X`, then `Y`, then `Enter`

## Troubleshooting

### "I don't see Client ID or Client Secret"

- Make sure you've **completed the application registration**
- Look for **"My Apps"** → select your app
- Check if there's a **"Credentials"** or **"Settings"** tab
- Try refreshing the page

### "Client Secret is hidden and I can't reveal it"

- Some portals only show it once when you first create the app
- Look for **"Regenerate Secret"** or **"Reset Secret"** button
- ⚠️ **Warning**: Regenerating will invalidate the old secret!

### "I can't find the API Key section"

- Look for **"API Keys"** in the top menu
- Or check the sidebar for **"Keys"**
- It might be under **"Products"** → **"League of Legends"** → **"API Keys"**

### "The page looks different"

Riot sometimes updates their portal. Look for:
- **"Applications"** instead of "Apps"
- **"Credentials"** section
- **"OAuth"** settings
- **"RSO"** (Riot Sign On) settings

## Quick Checklist

- [ ] Signed in to https://developer.riotgames.com/
- [ ] Created/registered a new application
- [ ] Added redirect URI: `http://localhost:4000/auth/riot/callback`
- [ ] Found and copied **Client ID**
- [ ] Found and copied **Client Secret** (clicked "Show" if needed)
- [ ] Created and copied **API Key** (Development key for now)
- [ ] Added all three to `apps/api/.env` file
- [ ] Saved the `.env` file

## Still Stuck?

If you're still having trouble:

1. **Take a screenshot** of what you see (blur out any sensitive info)
2. **Describe** which step you're on
3. **Check** if you see any error messages

The credentials are definitely there - they might just be in a different location depending on Riot's current portal design!
