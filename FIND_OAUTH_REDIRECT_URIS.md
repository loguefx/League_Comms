# How to Find OAuth Redirect URIs in Riot Developer Portal

## ⚠️ Important: OAuth Settings Are NOT on the API Key Page

The page you're on (`/app/729699/apis`) shows **API methods and rate limits**.  
OAuth Redirect URIs are in a **different location**.

## Step-by-Step: Find OAuth Redirect URIs

### Step 1: Go to Applications Dashboard

1. In the Riot Developer Portal, look at the **top navigation bar**
2. Click on **"APIS"** or look for **"Applications"** in the menu
3. You should see a list of your applications
4. **Click on your application name** (e.g., "League Comm Companion")

### Step 2: Look for Application Details Page

After clicking your application, you should see:
- Application name
- Application details
- **NOT** the API methods page

### Step 3: Find OAuth Section

Look for one of these sections/tabs:

**Option A: Main Dashboard**
- Scroll down on the application details page
- Look for **"OAuth Redirect URIs"** or **"Redirect URIs"** section

**Option B: Settings/Configuration Tab**
- Look for tabs like: **"Settings"**, **"Configuration"**, **"OAuth"**, or **"Security"**
- Click on one of these tabs
- Look for **"OAuth Redirect URIs"** or **"Redirect URIs"**

**Option C: Edit Application**
- Look for an **"Edit"** or **"Manage"** button
- Click it
- Look for OAuth settings

### Step 4: Alternative Navigation Path

If you can't find it, try this:

1. **Go to the main dashboard**: https://developer.riotgames.com/
2. Look for **"My Applications"** or **"Applications"** in the sidebar or menu
3. Click on your application
4. You should see tabs or sections like:
   - Overview
   - Settings
   - OAuth
   - API Keys
   - etc.

5. Click on **"OAuth"** or **"Settings"** tab

## What You're Looking For

You need to find a section that shows:
- **"OAuth Redirect URIs"** or **"Redirect URIs"**
- A list of URIs (might be empty)
- An **"Add"** or **"Add Redirect URI"** button
- Input field to enter a new URI

## If You Still Can't Find It

### Check Application Type

1. Make sure your application is set up for **OAuth**
2. Some application types might not support OAuth
3. You might need to create a new application with OAuth enabled

### Look for These Keywords

Search the page for:
- "redirect"
- "callback"
- "OAuth"
- "URI"
- "URL"

### Check Different Views

1. Try the **list view** of applications (if available)
2. Try the **detail view** of your application
3. Look for **"Manage"** or **"Configure"** options

## Visual Guide

**What you're currently seeing:**
```
DEVELOPMENT API KEY
├── API Methods List
├── Rate Limits
└── Filter by path
```

**What you need to find:**
```
APPLICATION: League Comm Companion
├── Application Details
├── OAuth Redirect URIs  ← THIS IS WHAT YOU NEED
│   ├── [Add Redirect URI button]
│   └── [List of URIs]
└── API Keys
```

## Quick Test

1. **Go to**: https://developer.riotgames.com/
2. **Click**: "APIS" or "Applications" in the top menu
3. **Find**: Your application in the list
4. **Click**: On the application name (not the API key)
5. **Look for**: OAuth or Settings section

## Still Can't Find It?

The OAuth Redirect URIs might be:
1. **On a different page** - try clicking around the application
2. **Require a different application type** - you might need to create an OAuth application
3. **In a different location** - Riot's UI might have changed

**Try this:**
1. Look for any **"Edit"** or **"Configure"** button on your application
2. Check if there are **tabs** at the top of the application page
3. Look in the **left sidebar** for navigation options

## Alternative: Check Application Creation

If you created the application recently:
1. Go back to where you **created** the application
2. OAuth settings might be set during creation
3. Or might be in the application's main settings page

## What to Do Once You Find It

1. Click **"Add Redirect URI"** or **"Add"**
2. Enter: `http://192.168.0.159:4000/auth/riot/callback`
3. Click **"Save"**
4. Wait 1-2 minutes
5. Try connecting again
