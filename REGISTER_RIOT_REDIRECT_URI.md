# Register Redirect URI in Riot Developer Portal - Step by Step

## ⚠️ CRITICAL: This MUST be done for OAuth to work!

The error "An error occurred! Please try again later" from Riot means your redirect URI is **not registered**.

## Your Current Redirect URI

From your API logs, your redirect URI is:
```
http://192.168.0.159:4000/auth/riot/callback
```

This **EXACT** URI must be registered in the Riot Developer Portal.

## Step-by-Step Instructions

### Step 1: Go to Riot Developer Portal

1. Open browser: https://developer.riotgames.com/
2. **Log in** with your Riot account
3. You should see the **Dashboard**

### Step 2: Find Your Application

1. Look for **"Applications"** in the left sidebar or top menu
2. Click on **"Applications"**
3. Find **"League Comm Companion"** (or whatever you named it)
4. **Click on it** to open the application details

### Step 3: Find OAuth Redirect URIs Section

1. Scroll down or look for a section called:
   - **"OAuth Redirect URIs"**
   - **"Redirect URIs"**
   - **"Allowed Redirect URIs"**
   - **"Callback URLs"**

2. This section might be:
   - On the main application page
   - In a **"Settings"** or **"Configuration"** tab
   - In an **"Edit"** or **"Manage"** section

### Step 4: Add the Redirect URI

1. Click **"Add Redirect URI"** or **"Add"** button
2. In the input field, type **EXACTLY** (case-sensitive, no trailing slash):
   ```
   http://192.168.0.159:4000/auth/riot/callback
   ```
3. **Click "Save"** or **"Add"**

### Step 5: Verify It's Added

1. You should see the URI in the list:
   ```
   http://192.168.0.159:4000/auth/riot/callback
   ```
2. Make sure there are **no typos**
3. Make sure there's **no trailing slash** (`/` at the end)
4. Make sure it matches **EXACTLY** what's in your `.env` file

### Step 6: Wait for Propagation

1. **Save** all changes
2. **Wait 1-2 minutes** for Riot's servers to update
3. Try connecting again

## Common Issues

### Issue 1: Can't Find OAuth Redirect URIs Section

**Possible locations:**
- Main application dashboard (not the edit form)
- Settings/Configuration tab
- Security tab
- OAuth/API tab

**If you still can't find it:**
- Look for any section about "OAuth" or "API"
- Check if there's a "Show More" or "Advanced" option
- Try clicking "Edit" on your application

### Issue 2: URI Already Exists But Still Failing

**Check:**
1. Is there a **trailing slash**? Remove it if present
2. Is it **http** not **https**? (Should be http for local IP)
3. Does it match **EXACTLY** (case-sensitive)?
4. Did you **save** the changes?

### Issue 3: Can't Add Multiple URIs

**Solution:**
- You can add multiple redirect URIs
- Add both:
  - `http://192.168.0.159:4000/auth/riot/callback`
  - `http://localhost:4000/auth/riot/callback` (for local testing)

### Issue 4: Changes Not Taking Effect

**Solution:**
1. Make sure you clicked **"Save"** or **"Apply"**
2. Wait **2-3 minutes** for propagation
3. Try clearing browser cache
4. Try in incognito/private window

## Verification Checklist

After adding the redirect URI, verify:

- [ ] URI is in the list: `http://192.168.0.159:4000/auth/riot/callback`
- [ ] No trailing slash
- [ ] Matches exactly what's in `apps/api/.env` file
- [ ] Saved the changes
- [ ] Waited 1-2 minutes
- [ ] Tried connecting again

## Test After Registration

1. Go to Settings page
2. Click "Connect Riot Account"
3. Should redirect to Riot login (not error page)
4. After login, should redirect back with code
5. Check API logs for: `Processing OAuth callback with code: ...`

## Still Not Working?

### Check API Logs

After trying to connect, check your API console. You should see:

**If redirect URI is registered:**
```
=== OAuth Callback Received ===
Full URL: /auth/riot/callback?code=abc123...
Has code: true
```

**If redirect URI is NOT registered:**
```
=== OAuth Callback Received ===
Full URL: /auth/riot/callback
Has code: false
Has error: true
Error: invalid_redirect_uri
```

### Double-Check Your .env

Make sure `apps/api/.env` has:
```env
RIOT_REDIRECT_URI=http://192.168.0.159:4000/auth/riot/callback
```

And it matches **EXACTLY** what you registered in the portal.

## Alternative: Use localhost

If you're testing on the same machine, you can use:

1. **In `.env`:**
   ```env
   RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback
   ```

2. **In Riot Developer Portal:**
   Add: `http://localhost:4000/auth/riot/callback`

3. **Access web app via:**
   `http://localhost:3000` (not the IP address)

This might be easier for initial testing.
