# Finding OAuth Application (Client ID/Secret) on Dashboard

## What You're Seeing

You're on the **main Developer Portal dashboard**. This shows:
- ✅ Development API Key (you have this)
- ✅ Rate limits
- ✅ Documentation

**But Client ID and Client Secret are NOT here!** They're in a **separate OAuth Application** section.

## Important: Two Different Things

1. **API Key** = For making API calls (what you see on dashboard)
2. **OAuth Application** = Has Client ID/Secret (for user authentication)

These are **separate** in Riot's system!

## Where to Find OAuth Application

### Step 1: Look for OAuth/RSO Section

In the top navigation bar, look for:
- **"APIS"** tab (you see this)
- **"MY ACCOUNT"** (you see this)
- Look for: **"OAuth"**, **"RSO"**, **"Applications"**, or **"My Apps"**

### Step 2: Check "MY ACCOUNT" Menu

1. Click on **"MY ACCOUNT"** (top right)
2. Look for a dropdown menu
3. Check for:
   - **"My Applications"**
   - **"OAuth Applications"**
   - **"RSO Applications"**
   - **"Applications"**

### Step 3: Look for "REGISTER PRODUCT" Related Options

Since you see **"REGISTER PRODUCT"** button, OAuth apps might be:
- Under the same menu
- In a related section
- Or you need to register an OAuth app separately

### Step 4: Check if You Need to Create OAuth App

You might need to **create an OAuth Application** first:

1. Look for:
   - **"Create OAuth Application"**
   - **"Register OAuth App"**
   - **"New Application"**
   - Or similar button/link

2. This is **different** from registering a product
3. OAuth apps are for user authentication (Client ID/Secret)
4. Products are for API access (API Keys)

## Navigation to Try

### Option 1: Check Top Menu

Look at the top navigation:
- **"APIS"** → might have OAuth section
- **"MY ACCOUNT"** → dropdown might have "Applications"
- **"SUPPORT"** → might have links

### Option 2: Look for Application Management

Somewhere on the page or in navigation, look for:
- **"Applications"**
- **"My Apps"**
- **"OAuth"**
- **"RSO"** (Riot Sign On)

### Option 3: Check Sidebar or Footer

- Left sidebar might have navigation
- Footer might have links
- Look for "Applications" or "OAuth"

## What You Need to Do

### If OAuth App Doesn't Exist Yet:

1. **Find "Create OAuth Application"** or similar
2. **Fill out the form:**
   - Application Name: `League Voice Companion`
   - Redirect URI: `http://192.168.0.159:4000/auth/riot/callback`
   - Scopes: `openid`, `profile`, `offline_access`
3. **After creating**, Client ID and Secret will be shown immediately
4. **Copy them right away** (especially Secret - might only show once!)

### If OAuth App Already Exists:

1. **Find "My Applications"** or **"OAuth Applications"**
2. **Click on your application**
3. **View the credentials page** (not edit form)
4. **Client ID** should be visible
5. **Client Secret** might be hidden - click **"Show"** to reveal

## Quick Actions to Try

1. **Click "MY ACCOUNT"** → check dropdown for "Applications"
2. **Look for "Applications"** or **"OAuth"** in navigation
3. **Check "APIS" tab** → might have OAuth section
4. **Look for "Create Application"** or **"Register OAuth App"** button
5. **Search the page** for "Client ID" or "OAuth"

## Important Note

The **API Key** you see is for making API calls to Riot's servers.

The **Client ID and Secret** are for OAuth authentication - they're managed separately and might be in:
- A different section of the portal
- Under "My Account" → "Applications"
- Or you need to create an OAuth app first

## What to Look For

When you find the OAuth section, you should see:

```
┌─────────────────────────────────────┐
│ OAuth Application                    │
├─────────────────────────────────────┤
│ Application Name: League Voice...   │
│ Client ID: abc123xyz789             │ ← Copy this
│ Client Secret: [Show] ••••••••      │ ← Click "Show"
│ Redirect URIs:                      │
│ • http://192.168.0.159:4000/...     │
└─────────────────────────────────────┘
```

## Still Can't Find It?

Try these:
1. **Check the URL** - are you on the main dashboard or a specific section?
2. **Look for a search bar** - search for "OAuth" or "Client ID"
3. **Check documentation** - "DOCS" link might explain where OAuth apps are
4. **Contact support** - "SUPPORT" link if you're really stuck

The OAuth application section is definitely there - it's just separate from the API key dashboard!
