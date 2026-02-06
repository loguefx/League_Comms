# Finding Client ID and Secret on Your Product Page

## What You're Seeing

You're on the **Product Details** page. This shows:
- Product information
- API Key (which you already have)
- Rate limits

**But Client ID and Client Secret are NOT here!** They're in the **OAuth Application** settings.

## Where to Find Client ID and Secret

### Option 1: Click "EDIT APP" Button

1. Click the red **"EDIT APP"** button
2. This should take you to the application settings
3. Look for:
   - **Client ID** (might be labeled as "App ID" or "Client ID")
   - **Client Secret** (might be hidden - look for "Show" button)

### Option 2: Look for OAuth/RSO Section

The Client ID and Secret are typically in a separate **OAuth** or **RSO** (Riot Sign On) section:

1. Look for additional tabs or sections:
   - **"OAuth"** tab
   - **"RSO"** tab
   - **"Credentials"** section
   - **"Application Settings"** section

2. Check the sidebar or navigation menu for:
   - **"OAuth Applications"**
   - **"RSO Settings"**
   - **"Application Credentials"**

### Option 3: Check the "APIS" Tab

1. Click the **"APIS"** tab (next to "DETAILS")
2. This might show OAuth settings or application credentials
3. Look for Client ID and Client Secret there

### Option 4: App ID Might Be Client ID

The **"App ID"** shown in General Info might actually be your **Client ID**!

- Check if it looks like a UUID or alphanumeric string
- If so, that's your `RIOT_CLIENT_ID`
- You still need to find the **Client Secret** though

## What to Look For

When you find the right section, you should see:

```
┌─────────────────────────────────────┐
│ OAuth Application Settings          │
├─────────────────────────────────────┤
│ Client ID:                          │
│ abc123xyz789                        │ ← Copy this
│                                     │
│ Client Secret:                      │
│ [Show] ••••••••••••••               │ ← Click "Show"
└─────────────────────────────────────┘
```

## Step-by-Step Actions

### Try This First:

1. **Click "EDIT APP"** button
   - This might reveal the OAuth credentials
   - Look for Client ID and Client Secret fields

2. **Click "APIS" tab**
   - Check if OAuth settings are there
   - Look for application credentials

3. **Check the "App ID" in General Info**
   - This might be your Client ID
   - Copy it and see if it works
   - You still need to find Client Secret

### If Still Not Found:

1. **Look for a menu or navigation**
   - Check top menu bar
   - Check left sidebar
   - Look for "Applications", "OAuth", or "RSO"

2. **Check if you need to create an OAuth app**
   - You might have created a Product but not an OAuth Application
   - Look for "Create OAuth Application" or "Register Application"
   - OAuth apps are separate from Products

## Important Note

**Products vs Applications:**
- **Product** = What you registered (League of Legends integration) - This is what you're viewing
- **OAuth Application** = Has Client ID/Secret - This is what you need to find/create

You might need to:
1. Create an OAuth Application within your Product
2. Or find the OAuth Application settings for your Product

## Quick Checklist

- [ ] Clicked "EDIT APP" button
- [ ] Checked "APIS" tab
- [ ] Looked for "OAuth" or "RSO" sections
- [ ] Checked if "App ID" is the Client ID
- [ ] Looked for "Client Secret" field (might be hidden)

## What to Do Next

1. **Try clicking "EDIT APP"** - this is most likely where they are
2. **Check the "APIS" tab** - might have OAuth settings
3. **Look around the page** for any "OAuth", "RSO", or "Credentials" links
4. **Check if "App ID" works as Client ID** - you still need the Secret though

The Client ID and Secret are definitely somewhere - they're just in the OAuth/Application settings, not the Product details page!
