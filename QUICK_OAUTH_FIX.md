# Quick Fix: Register OAuth Redirect URI

## The Problem

Riot is showing "An error occurred!" because the redirect URI `http://192.168.0.159:4000/auth/riot/callback` is not registered.

## The Solution

OAuth Redirect URIs are in **OAuth Applications**, not the Product/API page you're on.

## Fastest Way to Find It

### ⚠️ Important: Products vs OAuth Applications

**The 404 error confirms:** Products (`/app/729699`) and OAuth Applications are **SEPARATE**!

- **Product (729699)** = API keys, API methods (what you see at `/apis`)
- **OAuth Application** = Client ID/Secret, Redirect URIs (different section!)

You need to find the **OAuth Applications** section, not the Product page.

### Method 1: Try Direct OAuth URLs (START HERE!)

Try these URLs in your browser (one should work):

```
https://developer.riotgames.com/oauth2/applications
https://developer.riotgames.com/applications
https://developer.riotgames.com/my-applications
https://developer.riotgames.com/oauth
```

### Method 2: Go to Main Dashboard

Try these URLs in your browser:

```
https://developer.riotgames.com/oauth2/applications
https://developer.riotgames.com/applications
https://developer.riotgames.com/my-applications
```

1. Go to: `https://developer.riotgames.com/`
2. Look for:
   - **"OAuth Applications"** section
   - **"Applications"** link in top navigation
   - **"MY ACCOUNT"** dropdown → **"Applications"**
   - **"Create OAuth Application"** button

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
