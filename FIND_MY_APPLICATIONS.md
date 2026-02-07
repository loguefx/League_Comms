# Finding Your Applications in Riot Developer Portal

## Quick Steps

### Step 1: Click "APPS" in the Dropdown Menu

1. Look at the **top right** of the page
2. You should see your username: **"LOGUEFX702"**
3. **Click on your username** (or the dropdown arrow next to it)
4. You'll see a menu with:
   - DASHBOARD
   - **APPS** ← Click this!
   - GROUPS
   - LOGOUT

### Step 2: View Your Applications

After clicking **"APPS"**, you should see:
- A list of your registered applications
- Your "League Comm Companion" application (if it exists)
- Or an option to create a new application

### Step 3: Open Your Application

1. **Click on "League Comm Companion"** (or whatever you named it)
2. This will take you to the application details page
3. Look for sections like:
   - **"OAuth Settings"**
   - **"Redirect URIs"**
   - **"Credentials"** (Client ID/Secret)

## If You Don't See "APPS" in the Menu

### Alternative Navigation

Try these direct URLs:

```
https://developer.riotgames.com/apps
https://developer.riotgames.com/my-applications
https://developer.riotgames.com/oauth2/applications
```

### Or Look for These Links

On the main dashboard, look for:
- **"My Applications"** link
- **"Applications"** in the top navigation
- **"OAuth"** or **"RSO"** section
- **"REGISTER PRODUCT"** button (might lead to applications)

## If You Don't Have an Application Yet

If clicking "APPS" shows an empty list or "No applications", you need to create one:

1. Look for **"Create Application"** or **"New Application"** button
2. Fill out the form:
   - **Application Name**: `League Voice Companion`
   - **Redirect URI**: `http://192.168.0.159:4000/auth/riot/callback`
   - **Scopes**: `openid`, `account`, `offline_access`
3. After creating, you'll immediately see:
   - **Client ID** (copy this!)
   - **Client Secret** (copy this immediately - it might only show once!)

## What You're Looking For

Once you're in your application page, you need to find:

1. **Client ID** - A number like `795190` (you mentioned seeing this)
2. **Client Secret** - A long string (hidden, click "Show" to reveal)
3. **OAuth Redirect URIs** section - Where you add `http://192.168.0.159:4000/auth/riot/callback`

## Next Steps After Finding Your Application

1. **Copy Client ID and Secret** → Update `apps/api/.env`
2. **Add Redirect URI** → `http://192.168.0.159:4000/auth/riot/callback`
3. **Save changes**
4. **Wait 1-2 minutes** for changes to propagate
5. **Try connecting again**

## Still Can't Find It?

If you still don't see your applications after clicking "APPS":

1. **Check if you're logged in** - Make sure you see "LOGUEFX702" in the top right
2. **Try a different browser** - Sometimes cache issues
3. **Contact Riot Support** - They can help you locate your applications
