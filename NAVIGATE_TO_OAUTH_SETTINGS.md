# Navigate from API Key Page to OAuth Redirect URIs

## Current Location

You're on: `https://developer.riotgames.com/app/729699/apis`

This page shows:
- ✅ API methods
- ✅ Rate limits
- ❌ NOT OAuth Redirect URIs

## How to Get to OAuth Redirect URIs

### Method 1: Go to Application Main Page

1. **Look at the URL**: You're on `/app/729699/apis`
2. **Change the URL** to: `/app/729699` (remove `/apis`)
3. Or click on your **application name** at the top of the page
4. This should take you to the **main application page**

### Method 2: Use Navigation

1. **Look for breadcrumbs** at the top:
   ```
   Home > Applications > League Comm Companion > APIs
   ```
2. **Click on "League Comm Companion"** (your app name)
3. This takes you to the main application page

### Method 3: Start from Dashboard

1. **Go to**: https://developer.riotgames.com/
2. **Click**: "APIS" in the top menu
3. **Find**: Your application in the list
4. **Click**: On the application **name** (not "View APIs" or similar)
5. This should show the **application details page**

## What You Should See on Application Page

Once you're on the main application page (`/app/729699`), look for:

### Tabs or Sections:
- **Overview** or **Details**
- **Settings** or **Configuration**
- **OAuth** or **RSO**
- **API Keys** (this is where you were)
- **Redirect URIs** or **OAuth Redirect URIs**

### Look For:
1. **Tabs at the top** of the page - click "Settings" or "OAuth"
2. **Sections on the page** - scroll down to find "OAuth Redirect URIs"
3. **Left sidebar** - might have navigation links
4. **"Edit" or "Configure" button** - might open OAuth settings

## If You See Application Details Page

The page should show:
```
┌─────────────────────────────────────┐
│ League Comm Companion                │
├─────────────────────────────────────┤
│ [Tabs: Overview | Settings | APIs]   │
│                                      │
│ OAuth Redirect URIs                  │
│ ┌─────────────────────────────────┐ │
│ │ [Add Redirect URI button]        │ │
│ │                                  │ │
│ │ [List of URIs - might be empty]  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Quick Navigation Steps

1. **From current page** (`/app/729699/apis`):
   - Click your **application name** at the top
   - OR change URL to `/app/729699` (remove `/apis`)

2. **On application page** (`/app/729699`):
   - Look for **"OAuth Redirect URIs"** section
   - OR click **"Settings"** tab
   - OR click **"OAuth"** tab

3. **Add the URI**:
   - Click **"Add Redirect URI"**
   - Enter: `http://192.168.0.159:4000/auth/riot/callback`
   - Click **"Save"**

## Alternative: Direct URL

Try going directly to:
```
https://developer.riotgames.com/app/729699
```

Then look for OAuth settings on that page.

## If You Still Can't Find It

The OAuth Redirect URIs might be:
1. **In a different location** - Riot's UI might have changed
2. **Require creating an OAuth app first** - you might have a Product but not an OAuth Application
3. **Under a different name** - look for "Callback URLs", "Redirect URLs", etc.

## What to Look For

Search the page for these keywords:
- "redirect"
- "callback"
- "OAuth"
- "URI"
- "URL"

Or look for buttons/links:
- "Add Redirect URI"
- "Manage OAuth"
- "Configure OAuth"
- "Edit Redirect URIs"
