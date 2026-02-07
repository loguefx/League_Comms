# Finding OAuth Applications (Not Products)

## ⚠️ Important: Products vs OAuth Applications

You created a **Product** (for API keys), but OAuth Redirect URIs are in **OAuth Applications**, which is a **separate section**.

## Step 1: Go to Main Dashboard

1. Go to: https://developer.riotgames.com/
2. Make sure you're **logged in**
3. You should see the main dashboard

## Step 2: Look for OAuth/Applications Section

OAuth Applications are usually in one of these places:

### Option A: Top Navigation Menu

Look at the **top navigation bar** for:
- **"APIS"** (you see this)
- **"MY ACCOUNT"** (top right)
- Look for: **"Applications"**, **"OAuth"**, **"RSO"**, or **"My Apps"**

### Option B: MY ACCOUNT Dropdown

1. Click **"MY ACCOUNT"** (top right, next to your username)
2. Look for dropdown menu items:
   - **"My Applications"**
   - **"OAuth Applications"**
   - **"RSO Applications"**
   - **"Applications"**

### Option C: Main Dashboard Links

On the main dashboard, look for:
- **"My Applications"** card/section
- **"OAuth Applications"** link
- **"Manage Applications"** button
- **"Create OAuth Application"** button

### Option D: Left Sidebar

If there's a left sidebar, look for:
- **"Applications"**
- **"OAuth"**
- **"RSO"**

## Step 3: If You Don't See OAuth Applications

You might need to **create an OAuth Application** first:

1. Look for **"Create OAuth Application"** or **"Register OAuth App"** button
2. Or go to: **"APIS"** → Look for **"OAuth"** or **"RSO"** section
3. Click **"Create"** or **"New Application"**

## Step 4: What to Look For

When you find OAuth Applications, you should see:

```
┌─────────────────────────────────────┐
│ OAuth Applications                   │
├─────────────────────────────────────┤
│ [Create New Application]             │
│                                      │
│ Your Applications:                  │
│ ┌─────────────────────────────────┐ │
│ │ League Comm Companion            │ │
│ │ Client ID: 795190                │ │
│ │ [View] [Edit] [Delete]           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Step 5: Access OAuth Application Settings

1. **Click on your OAuth Application** name
2. OR click **"View"** or **"Edit"**
3. You should see:
   - Client ID
   - Client Secret
   - **OAuth Redirect URIs** ← THIS IS WHAT YOU NEED

## Alternative: Direct Navigation URLs to Try

Try these URLs (replace with your actual IDs if needed):

1. **OAuth Applications list:**
   ```
   https://developer.riotgames.com/oauth2/applications
   ```

2. **My Applications:**
   ```
   https://developer.riotgames.com/applications
   ```

3. **RSO Applications:**
   ```
   https://developer.riotgames.com/rso/applications
   ```

## If You Need to Create OAuth Application

If you can't find existing OAuth applications, you might need to create one:

1. **Find "Create OAuth Application"** button
2. **Fill out the form:**
   - **Application Name**: `League Voice Companion`
   - **Redirect URI**: `http://192.168.0.159:4000/auth/riot/callback`
   - **Scopes**: `openid`, `account`
3. **After creating**, you'll see:
   - **Client ID** (e.g., `795190`)
   - **Client Secret** (copy this immediately!)
   - **Redirect URIs** section (where you can add more)

## Quick Checklist

- [ ] Go to main dashboard: https://developer.riotgames.com/
- [ ] Check "MY ACCOUNT" dropdown
- [ ] Look for "Applications" or "OAuth" in navigation
- [ ] Check if you need to create an OAuth Application first
- [ ] Once found, look for "OAuth Redirect URIs" section
- [ ] Add: `http://192.168.0.159:4000/auth/riot/callback`

## Still Can't Find It?

The OAuth Applications section might be:
1. **Under a different name** - look for "RSO", "Sign On", "Authentication"
2. **In a different portal** - some Riot services use separate portals
3. **Require special access** - might need to request OAuth access first

**Try searching the page for:**
- "Client ID"
- "OAuth"
- "Redirect"
- "Application"
