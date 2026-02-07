# Fix: 404 Error - OAuth Application Not Found

## The Problem

You're getting a 404 error at `https://developer.riotgames.com/app/729699` because:

**Products (like `729699`) and OAuth Applications are SEPARATE in Riot's system!**

- **Product** (`729699`) = For API keys and API access
- **OAuth Application** = For user authentication (Client ID/Secret, Redirect URIs)

You might have created a **Product** but not an **OAuth Application** yet.

## Solution: Find or Create OAuth Application

### Step 1: Go Back to Main Dashboard

1. Go to: `https://developer.riotgames.com/`
2. You should see the main dashboard

### Step 2: Look for OAuth/RSO Section

On the main dashboard, look for:

**Option A: Top Navigation**
- Look for **"APIS"** tab (you see this)
- Check if there's an **"OAuth"** or **"RSO"** tab
- Or look for **"Applications"** in the top menu

**Option B: Main Dashboard Sections**
- Look for a section titled:
  - **"OAuth Applications"**
  - **"RSO Applications"** (Riot Sign On)
  - **"My Applications"**
  - **"Applications"**

**Option C: "REGISTER PRODUCT" Area**
- You saw a **"REGISTER PRODUCT"** button earlier
- Look near that area for:
  - **"Create OAuth Application"**
  - **"Register OAuth App"**
  - **"New OAuth Application"**

### Step 3: Create OAuth Application (If It Doesn't Exist)

If you can't find an existing OAuth application, you need to create one:

1. **Find "Create OAuth Application"** or similar button
2. **Fill out the form:**
   - **Application Name**: `League Voice Companion`
   - **Redirect URI**: `http://192.168.0.159:4000/auth/riot/callback`
   - **Scopes**: `openid`, `account`, `offline_access`
3. **After creating**, you'll immediately see:
   - **Client ID** (copy this!)
   - **Client Secret** (copy this immediately - it might only show once!)
4. **Save the Redirect URI** you entered

### Step 4: If OAuth Application Already Exists

If you find an existing OAuth application:

1. **Click on it** to open its details page
2. Look for:
   - **"OAuth Redirect URIs"** section
   - **"Redirect URIs"** field
   - **"Add Redirect URI"** button
3. **Add**: `http://192.168.0.159:4000/auth/riot/callback`
4. **Save**

## Alternative: Try These Direct URLs

Try these URLs in your browser (one might work):

```
https://developer.riotgames.com/oauth2/applications
https://developer.riotgames.com/applications
https://developer.riotgames.com/my-applications
https://developer.riotgames.com/oauth
https://developer.riotgames.com/rso
```

## Check Your Product Page

Since `/app/729699/apis` works, try:

1. Go to: `https://developer.riotgames.com/app/729699/apis`
2. Look for:
   - **"OAuth"** link in the sidebar
   - **"Create OAuth Application"** button
   - **"Applications"** tab
   - **"Settings"** link

## Important: Two Different Systems

**Product (729699):**
- Has API keys
- Shows API methods and rate limits
- Located at `/app/729699/apis`

**OAuth Application:**
- Has Client ID/Secret
- Has Redirect URIs
- Separate from Products
- Might be at `/oauth2/applications` or similar

## What You Need

You need to find or create an **OAuth Application** that has:
- ✅ Client ID (you mentioned seeing `795190` - this suggests one exists!)
- ✅ Client Secret
- ✅ Redirect URI: `http://192.168.0.159:4000/auth/riot/callback`

## Next Steps

1. **Go to main dashboard**: `https://developer.riotgames.com/`
2. **Search the page** for "OAuth" or "Application"
3. **Look for "Create OAuth Application"** button
4. **Or try the direct URLs** above
5. **If you find it**, add the redirect URI
6. **If you can't find it**, you might need to contact Riot Support

## Still Stuck?

If you can't find OAuth applications anywhere:

1. **Check Riot's Documentation**: Look for "RSO OAuth" or "Riot Sign On" documentation
2. **Contact Riot Support**: They can guide you to the correct section
3. **Check if OAuth is enabled**: Some accounts might need OAuth access enabled first

The fact that you have a Client ID (`795190`) suggests an OAuth application exists somewhere - we just need to find where Riot has it in their portal!
