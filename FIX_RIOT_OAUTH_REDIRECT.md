# Fix Riot OAuth Redirect URI Error

## Problem
You're getting "An error occurred! Please try again later" when trying to link your Riot account. This is because the redirect URI is not registered or doesn't match exactly in the Riot Developer Portal.

## Solution

### Step 1: Check Your Current Redirect URI

Your redirect URI is: `http://192.168.0.159:4000/auth/riot/callback`

This is set in your `apps/api/.env` file:
```
RIOT_REDIRECT_URI=http://192.168.0.159:4000/auth/riot/callback
```

### Step 2: Add Redirect URI to Riot Developer Portal

1. Go to https://developer.riotgames.com/
2. Log in with your Riot account
3. Navigate to **Applications** → **Your Application** (League Comm Companion)
4. Find the **OAuth Redirect URIs** section
5. Click **Add Redirect URI** or **Edit**
6. Add **EXACTLY** this URI (case-sensitive, no trailing slash):
   ```
   http://192.168.0.159:4000/auth/riot/callback
   ```
7. **Save** the changes

### Step 3: Important Notes

⚠️ **Riot OAuth Redirect URI Requirements:**
- Must match **EXACTLY** (case-sensitive)
- No trailing slashes
- Must include the full path: `/auth/riot/callback`
- HTTP is allowed for local development (localhost or IP addresses)
- For production, you'll need HTTPS

### Step 4: Verify Your Configuration

Make sure your `apps/api/.env` has:
```env
RIOT_CLIENT_ID=795190
RIOT_CLIENT_SECRET=your-riot-client-secret-here
RIOT_REDIRECT_URI=http://192.168.0.159:4000/auth/riot/callback
```

### Step 5: Restart Your API Server

After updating the redirect URI in the Riot Developer Portal:
```bash
# Stop your API server (Ctrl+C)
# Then restart it
cd apps/api
npm run dev
```

### Alternative: Use localhost (if testing on same machine)

If you're testing on the same machine as the server, you can use:
```env
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback
```

And add `http://localhost:4000/auth/riot/callback` to the Riot Developer Portal.

### Common Issues

1. **"Redirect URI mismatch"**
   - Check for typos in the redirect URI
   - Ensure no trailing slash
   - Verify it's added in the Riot Developer Portal

2. **"Invalid client"**
   - Verify your `RIOT_CLIENT_ID` matches the one in the portal
   - Verify your `RIOT_CLIENT_SECRET` is correct

3. **"Client secret missing"**
   - Make sure `RIOT_CLIENT_SECRET` is set in your `.env` file
   - The secret should be from the OAuth app, not the API key

### Still Not Working?

1. Check the Riot Developer Portal → Your Application → OAuth Redirect URIs
2. Verify the redirect URI is listed there
3. Make sure there are no extra spaces or characters
4. Try using `localhost` instead of IP address if testing locally
5. Wait a few minutes after adding the redirect URI (Riot may cache changes)
