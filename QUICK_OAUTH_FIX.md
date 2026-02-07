# Quick Fix: Register OAuth Redirect URI

## The Problem

Riot is showing "An error occurred!" because the redirect URI `http://192.168.0.159:4000/auth/riot/callback` is not registered.

## The Solution

OAuth Redirect URIs are in **OAuth Applications**, not the Product/API page you're on.

## Fastest Way to Find It

### Method 1: Check MY ACCOUNT Menu

1. On https://developer.riotgames.com/
2. Click **"MY ACCOUNT"** (top right, next to your username)
3. Look for **"Applications"** or **"OAuth Applications"** in the dropdown
4. Click it
5. Find your application → Click it
6. Look for **"OAuth Redirect URIs"** section

### Method 2: Try Direct URLs

Try these URLs in your browser:

```
https://developer.riotgames.com/oauth2/applications
https://developer.riotgames.com/applications
https://developer.riotgames.com/my-applications
```

### Method 3: Create OAuth App (If It Doesn't Exist)

If you can't find existing OAuth apps, you might need to create one:

1. Look for **"Create OAuth Application"** or **"Register OAuth App"** button
2. **Application Name**: `League Voice Companion`
3. **Redirect URI**: `http://192.168.0.159:4000/auth/riot/callback`
4. **Scopes**: `openid`, `account`
5. After creating, you'll get Client ID and Secret

## Once You Find OAuth Redirect URIs

1. Click **"Add Redirect URI"** or **"Add"**
2. Enter: `http://192.168.0.159:4000/auth/riot/callback`
3. **Save**
4. Wait 1-2 minutes
5. Try connecting again

## Your Current Setup

From your API logs:
- **Client ID**: `795190` ✅
- **Redirect URI needed**: `http://192.168.0.159:4000/auth/riot/callback` ❌ (not registered)

The Client ID `795190` suggests you DO have an OAuth Application. You just need to find where to add the redirect URI.

## Most Likely Location

OAuth Redirect URIs are usually:
- On the **OAuth Application details page** (not the Product page)
- In a **"Settings"** or **"Configuration"** section
- Listed under **"Redirect URIs"** or **"OAuth Redirect URIs"**

Try clicking **"MY ACCOUNT"** first - that's the most common location!
