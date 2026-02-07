# Getting to OAuth Settings from the API Page

## You're Currently On

You're on: `https://developer.riotgames.com/app/729699/apis`

This is the **API methods page** - it shows rate limits and available endpoints. OAuth settings are **not** on this page.

## Solution: Go to the Main Application Page

### Method 1: Change the URL (Fastest!)

1. Look at your browser's address bar
2. You should see: `https://developer.riotgames.com/app/729699/apis`
3. **Remove `/apis` from the end**
4. Change it to: `https://developer.riotgames.com/app/729699`
5. Press Enter

This takes you to the **main application page** where OAuth settings should be.

### Method 2: Look for Navigation Tabs

On the current page (`/apis`), look for:

- **Tabs at the top** of the page (like "Overview", "Settings", "APIs", "OAuth")
- **A sidebar** with links
- **Breadcrumbs** at the top (like "Home > Applications > League Comm Companion")

Click on:
- **"Settings"** tab
- **"OAuth"** tab
- **"Overview"** tab
- Or the **application name** in breadcrumbs

### Method 3: Use the Left Sidebar

Look at the **left sidebar** (the dark red area). You might see:
- Overview
- Settings
- **OAuth** ← Click this!
- APIs (you're here)
- Credentials

Click **"OAuth"** or **"Settings"** in the sidebar.

## What You're Looking For

Once you're on the main application page (not `/apis`), look for:

1. **"OAuth Redirect URIs"** section
2. **"Redirect URIs"** field
3. **"Add Redirect URI"** button
4. A list of existing redirect URIs

## If You Still Don't See OAuth Settings

### Try These Direct URLs

Replace `729699` with your actual application ID:

```
https://developer.riotgames.com/app/729699
https://developer.riotgames.com/app/729699/settings
https://developer.riotgames.com/app/729699/oauth
https://developer.riotgames.com/app/729699/credentials
```

### Check for "Edit" or "Configure" Button

On the main application page, look for:
- **"Edit Application"** button
- **"Configure OAuth"** button
- **"OAuth Settings"** link

## Quick Action Steps

1. **Go to**: `https://developer.riotgames.com/app/729699` (remove `/apis`)
2. **Look for tabs** at the top: "Overview", "Settings", "OAuth", etc.
3. **Click "OAuth"** or **"Settings"** tab
4. **Find "Redirect URIs"** section
5. **Add**: `http://192.168.0.159:4000/auth/riot/callback`
6. **Save**

## Still Can't Find It?

If the main application page (`/app/729699`) doesn't show OAuth settings:

1. **Check if this is an OAuth application** - You might have created a "Product" but not an "OAuth Application"
2. **Look for "Create OAuth Application"** button
3. **Contact Riot Support** - They can guide you to the correct section

## Your Application ID

Your application ID is: **729699**

Use this in the URLs above to navigate directly to your application's settings.
