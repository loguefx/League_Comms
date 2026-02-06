# Why Do We Need Riot Client ID and Secret?

## Important Clarification

**These credentials are NOT for detecting the League client.** They're for **authenticating users** with Riot's OAuth system (Riot Sign On - RSO).

## How It Actually Works

### What Each Credential Does

1. **RIOT_CLIENT_ID** + **RIOT_CLIENT_SECRET**
   - Used for **OAuth authentication** (Riot Sign On)
   - When a user wants to link their Riot account, they authenticate through Riot's OAuth system
   - Your app uses these to exchange authorization codes for access tokens
   - **This is how users log in and link their accounts**

2. **RIOT_API_KEY**
   - Used to make API calls to Riot's servers
   - Fetches match data, summoner info, live game data, etc.
   - **This is how you get game data**

### The Flow

```
1. User opens your app
2. User clicks "Link Riot Account"
3. Your app redirects to Riot's login page (using YOUR Client ID)
4. User logs in with their Riot account
5. Riot redirects back to your app with an authorization code
6. Your app exchanges the code for tokens (using YOUR Client Secret)
7. Your app now has access to that user's data
8. Your app uses YOUR API Key to fetch match data, live games, etc.
```

## Why We Can't "Auto-Detect" the League Client

### ❌ What We DON'T Do

- We **don't** hook into the League of Legends game client
- We **don't** read memory or inject code
- We **don't** automatically detect when League is running
- We **don't** extract credentials from the game

**This would violate Riot's terms of service!**

### ✅ What We DO

- Use **Riot's official APIs** (Spectator API, Match API, etc.)
- Poll the Spectator API to check if a user is in a game
- Use OAuth (Riot Sign On) for user authentication
- Respect rate limits and follow Riot's developer policies

## Why These Are Application-Level (Not User-Level)

### OAuth Applications Work This Way

- **One set of credentials per application** (not per user)
- All users authenticate through **your** application
- Riot knows which app is requesting access (via Client ID)
- Your app is registered in Riot's Developer Portal

### Example: Like Discord or Google OAuth

When you "Sign in with Google" on a website:
- The website has **one** Google Client ID
- All users authenticate through that same Client ID
- Google knows which website is requesting access
- Each user gets their own access token, but uses the same Client ID

**Same concept with Riot!**

## The User Experience

### What Users See

1. User installs your app
2. User clicks "Link Riot Account"
3. Browser/app opens Riot login page
4. User enters their Riot username/password
5. User authorizes your app
6. User is redirected back to your app
7. **Now your app can:**
   - Check if they're in a game (via Spectator API)
   - Fetch their match history
   - Show their stats
   - Join voice rooms with teammates

### What Users DON'T Need

- Users **don't** need their own API keys
- Users **don't** need to configure anything
- Users **don't** need to manually detect games
- Users just **link their account once** and everything works

## Why This Is Secure

### Your Credentials Are Safe

- **Client Secret** is stored server-side only (never in client code)
- **API Key** is used server-side (never exposed to users)
- Users never see or need your credentials
- Each user gets their own encrypted access tokens

### Standard OAuth Practice

This is how **all** OAuth applications work:
- GitHub OAuth
- Google OAuth
- Discord OAuth
- **Riot Sign On (RSO)**

## Summary

| Credential | Purpose | Who Needs It |
|------------|---------|--------------|
| **Client ID** | Identify your app to Riot | You (app developer) |
| **Client Secret** | Exchange auth codes for tokens | You (app developer) |
| **API Key** | Make API calls to Riot | You (app developer) |
| **User Access Token** | Access user's data | Each user (auto-generated) |

**You configure these once.** All users authenticate through your app using these credentials, then get their own access tokens automatically.

## This Is Production-Ready

✅ **One configuration** works for all users  
✅ **Standard OAuth** flow (secure and compliant)  
✅ **No client hooking** (respects Riot's policies)  
✅ **Scalable** (works for thousands of users)  

This is exactly how Discord, OP.GG, U.GG, and other Riot-integrated apps work!
