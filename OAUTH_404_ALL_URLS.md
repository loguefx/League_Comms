# All OAuth URLs Give 404 - Alternative Solutions

## The Situation

You've tried all these URLs and they all give 404:
- ❌ `https://developer.riotgames.com/oauth2/applications`
- ❌ `https://developer.riotgames.com/applications`
- ❌ `https://developer.riotgames.com/my-applications`
- ❌ `https://developer.riotgames.com/app/729699`

**But you DO have:**
- ✅ Client ID: `795190` (proves OAuth app exists)
- ✅ Product page: `/app/729699/apis` (works)

## This Means OAuth Apps Are Managed Differently

Riot's OAuth application management might be:
1. **Hidden in the Product page** (different tab/section)
2. **Requires special access** or permissions
3. **Only accessible through a specific workflow**
4. **Managed through Riot's API** (not the web portal)

## Solution 1: Check Product Page More Carefully

Since `/app/729699/apis` works, OAuth settings might be on the same Product page:

### Step 1: Go to Your Product Page
1. Go to: `https://developer.riotgames.com/app/729699/apis`
2. **Look carefully at the LEFT SIDEBAR** (the dark red area)
3. Look for these links:
   - **"Overview"**
   - **"Settings"**
   - **"OAuth"** or **"RSO"**
   - **"Credentials"**
   - **"Configuration"**
   - **"Redirect URIs"**

### Step 2: Check Top Tabs
Look at the **top of the page** for tabs:
- **"APIs"** (you're here)
- **"Settings"**
- **"OAuth"**
- **"Overview"**
- **"Details"**

Click each tab to see if OAuth settings are there.

### Step 3: Look for "Edit" or "Configure" Buttons
On the Product page, look for:
- **"Edit Application"** button
- **"Configure OAuth"** button
- **"OAuth Settings"** link
- **"Manage Redirect URIs"** link

## Solution 2: Check Riot's Documentation

Riot's OAuth setup might be documented:

1. Go to: `https://developer.riotgames.com/docs`
2. Search for:
   - **"RSO OAuth"**
   - **"Riot Sign On"**
   - **"OAuth Redirect URI"**
   - **"Client ID Secret"**
3. The documentation should tell you where to manage OAuth apps

## Solution 3: Contact Riot Support

Since all URLs give 404, this might be a portal issue:

1. Click **"SUPPORT"** (red link in top navigation)
2. Or go to: `https://developer.riotgames.com/support`
3. Ask: **"Where do I manage OAuth Redirect URIs for my application?"**
4. Provide:
   - Your Product ID: `729699`
   - Your Client ID: `795190`
   - The redirect URI you need: `http://192.168.0.159:4000/auth/riot/callback`

## Solution 4: Check if OAuth is Managed Through API

Some developers manage OAuth through API calls. Check Riot's API documentation for:
- OAuth management endpoints
- Redirect URI update endpoints

## Solution 5: Check Your Email

When you created the OAuth application, Riot might have sent:
- A confirmation email
- A link to manage the application
- Instructions on where to find settings

Check your email for messages from Riot Games.

## Solution 6: Try Different Navigation Paths

### From Main Dashboard:
1. Go to: `https://developer.riotgames.com/`
2. Look for **"REGISTER PRODUCT"** button
3. Click it and see if there's an **"OAuth"** or **"Applications"** option
4. Or look for **"Manage Products"** → might have OAuth settings

### From API Page:
1. On `/app/729699/apis`
2. Look for a **"Settings"** icon (gear/cog)
3. Or look for **"..."** (three dots menu)
4. Click it and see if OAuth options appear

## Solution 7: Check Browser Console

Sometimes hidden links are in the page source:

1. On any Riot Developer Portal page
2. Press **F12** (open Developer Tools)
3. Go to **"Console"** tab
4. Type: `document.querySelectorAll('a[href*="oauth"]')`
5. This might reveal hidden OAuth links

## What We Know

- ✅ OAuth application exists (Client ID: `795190`)
- ✅ Product exists (`729699`)
- ❌ Standard OAuth URLs don't work
- ❌ Product page without `/apis` gives 404

## Most Likely Solution

**OAuth settings are probably on the Product page (`/app/729699/apis`) but in a different tab or section:**

1. **Check the LEFT SIDEBAR** carefully
2. **Check TOP TABS** if they exist
3. **Look for "Settings"** or **"OAuth"** links
4. **Try clicking "Edit"** or **"Configure"** buttons

## If Nothing Works

**Contact Riot Support** - They can:
- Tell you the exact location of OAuth settings
- Help you add the redirect URI
- Verify your OAuth application setup

The fact that you have a Client ID means the OAuth app exists - we just need to find where Riot has hidden the management interface!
