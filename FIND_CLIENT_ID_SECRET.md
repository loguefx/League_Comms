# Where to Find Client ID and Client Secret

## Important: They're in a Different Section!

**Client ID and Client Secret** are **NOT** in the API Keys section. They're in your **Application/OAuth settings**.

## Where to Look

### Step 1: Go to Your Application Settings

1. In the Riot Developer Portal, look for:
   - **"My Apps"** (top menu)
   - **"Applications"** (sidebar)
   - **"OAuth Applications"**
   - **"RSO Applications"** (Riot Sign On)

2. Click on it

3. You should see a list of your applications, or if you only have one, it might show directly

4. **Click on your application name** (e.g., "League Voice Companion")

### Step 2: Find the Credentials Section

Once you're on your application's page, look for:

**Option A: Main Dashboard**
- The page might show "Application Details" or "Application Information"
- Look for a section with:
  - **Client ID**
  - **Client Secret**

**Option B: Settings Tab**
- Look for tabs at the top: **"Settings"**, **"Credentials"**, **"OAuth"**, or **"RSO"**
- Click on one of these tabs
- You'll see Client ID and Client Secret there

**Option C: Sidebar**
- Check the left sidebar for:
  - **"Credentials"**
  - **"OAuth Settings"**
  - **"RSO Settings"**
  - **"Application Settings"**

### Step 3: What You're Looking For

You should see something like this:

```
┌─────────────────────────────────────┐
│ Application: League Voice Companion │
├─────────────────────────────────────┤
│ Client ID:                          │
│ abc123xyz789def456                  │ ← Copy this
│                                     │
│ Client Secret:                      │
│ [Show] ••••••••••••••••             │ ← Click "Show", then copy
└─────────────────────────────────────┘
```

## Common Locations

### If You See a Dashboard with Tabs:

Look for these tabs and click them:
- **"Overview"** → might show credentials
- **"Settings"** → usually has credentials
- **"Credentials"** → definitely has them
- **"OAuth"** → OAuth credentials here
- **"RSO"** → Riot Sign On credentials

### If You See a List of Applications:

1. You might see a table with your apps
2. Click on the **name** of your application
3. Or click **"View"**, **"Edit"**, or **"Settings"** button
4. This takes you to the app details page where credentials are

## Troubleshooting

### "I don't see My Apps or Applications"

- Try looking in the **top navigation menu**
- Or check the **left sidebar**
- Some portals have a **hamburger menu** (☰) - click it
- Look for **"Dashboard"** and go there first

### "I only see API Keys, not Client ID/Secret"

- You're in the wrong section!
- API Keys and OAuth credentials are **separate**
- Go back to the main dashboard
- Look for **"Applications"** or **"OAuth"** section
- Not the **"API Keys"** section

### "I created a Product but not an Application"

**Important distinction:**
- **Product** = The overall product (League of Legends integration)
- **Application** = The OAuth app (has Client ID/Secret)

You need to create an **Application** within your Product:

1. Go to your Product page
2. Look for **"Create Application"** or **"Add Application"**
3. Fill out the application form
4. After creating, you'll see Client ID and Secret

### "The page looks different than expected"

Riot updates their portal design. Try:
- **Search bar**: Type "Client ID" or "OAuth"
- **Help/Support**: Look for documentation links
- **Menu**: Check all menu items for "Applications" or "OAuth"

## Step-by-Step Navigation

Try this exact path:

1. **Go to**: https://developer.riotgames.com/
2. **Sign in** (if not already)
3. **Click**: "My Apps" or "Applications" (top menu)
4. **Click**: Your application name (or "Create Application" if you haven't)
5. **Look for**: "Client ID" and "Client Secret" on this page
6. **If not visible**: Click "Settings" or "Credentials" tab
7. **Reveal Secret**: Click "Show" button next to Client Secret

## Alternative: Check Your Product Page

If you registered a Product first:

1. Go to **"Products"** or **"My Products"**
2. Click on your product (League of Legends)
3. Look for **"Applications"** section within the product
4. Click **"Create Application"** or click on existing application
5. Client ID and Secret will be there

## Quick Checklist

- [ ] Signed in to Riot Developer Portal
- [ ] Navigated to "My Apps" or "Applications"
- [ ] Clicked on your application name
- [ ] Looked for "Client ID" (should be visible)
- [ ] Looked for "Client Secret" (might be hidden - click "Show")
- [ ] Checked "Settings" or "Credentials" tab if not on main page

## Still Can't Find It?

If you're still stuck:

1. **What do you see?** Describe the page you're on
2. **What sections/tabs are visible?** List them
3. **Did you create an Application or just a Product?** (They're different!)

The Client ID and Secret are definitely there - they're just in the OAuth/Application settings, not the API Keys section!
