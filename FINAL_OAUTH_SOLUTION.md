# Final Solution: Finding OAuth Redirect URIs

## Current Situation

- ✅ You have Client ID: `795190` (OAuth app exists)
- ✅ You can access: `/app/729699/apis` (Product page works)
- ❌ All OAuth URLs give 404
- ❌ Need to add redirect URI: `http://192.168.0.159:4000/auth/riot/callback`

## Most Likely Solution: OAuth Settings Are on the Product Page

Since `/app/729699/apis` works, OAuth settings are probably **on the same Product page**, just in a different section.

### Step-by-Step: Examine Your Product Page

1. **Go to**: `https://developer.riotgames.com/app/729699/apis`

2. **Check the LEFT SIDEBAR** (dark red area):
   - Look for links like: "Overview", "Settings", "OAuth", "RSO", "Credentials", "Configuration"
   - **Click each link** to see what's there
   - OAuth settings might be under "Settings" or "Configuration"

3. **Check the TOP of the page**:
   - Look for **tabs** (like "APIs", "Settings", "OAuth", "Overview")
   - **Click each tab** to see if OAuth settings appear
   - Sometimes tabs are in a dropdown menu (three dots or "More")

4. **Look for "Edit" or "Manage" buttons**:
   - There might be an **"Edit Application"** button
   - Or a **"..."** (three dots) menu
   - Or a **gear icon** (⚙️) for settings
   - Click these to see if OAuth options appear

5. **Scroll down the page**:
   - OAuth settings might be below the API methods list
   - Look for sections like "OAuth Configuration" or "Redirect URIs"

### Alternative: Use Browser Developer Tools

1. On `/app/729699/apis`, press **F12** (open Developer Tools)
2. Go to **"Elements"** tab
3. Press **Ctrl+F** (search in page)
4. Search for: `oauth`, `redirect`, `client`, `secret`
5. This will highlight any hidden OAuth-related elements
6. **Right-click** on highlighted elements → **"Inspect"** → see if they're clickable links

## If You Still Can't Find It

### Option 1: Contact Riot Support (RECOMMENDED)

1. Click **"SUPPORT"** (red link in top navigation)
2. Or go to: `https://developer.riotgames.com/support`
3. Ask: **"I have Client ID 795190. Where do I add OAuth Redirect URIs?"**
4. Provide:
   - Product ID: `729699`
   - Client ID: `795190`
   - Redirect URI needed: `http://192.168.0.159:4000/auth/riot/callback`

### Option 2: Check Riot's Documentation

1. Go to: `https://developer.riotgames.com/docs`
2. Search for: **"RSO OAuth"**, **"Riot Sign On"**, **"OAuth Redirect URI"**
3. The documentation should explain where to manage OAuth settings

### Option 3: Check Your Email

When you created the OAuth application, Riot might have sent:
- A confirmation email with a link to manage it
- Instructions on where to find settings
- Check your email for messages from Riot Games

## What We Know for Sure

- ✅ OAuth application exists (Client ID: `795190`)
- ✅ Product exists (`729699`)
- ✅ OAuth settings exist somewhere in the portal
- ❌ Standard OAuth URLs don't work (portal structure might be different)

## Most Likely Location

**OAuth settings are probably:**
- On the Product page (`/app/729699/apis`) in a **"Settings"** or **"OAuth"** tab/section
- Or accessible through an **"Edit"** or **"Configure"** button on that page
- Or in the **left sidebar** of the Product page

## Quick Checklist

- [ ] Go to `/app/729699/apis`
- [ ] Check LEFT SIDEBAR for "Settings", "OAuth", "Configuration"
- [ ] Check TOP TABS for "Settings", "OAuth", "Overview"
- [ ] Look for "Edit" or "..." menu buttons
- [ ] Scroll down the page for OAuth sections
- [ ] Use F12 → Search for "oauth" or "redirect"
- [ ] Contact Riot Support if nothing works

## Why This Is Happening

Riot's Developer Portal might:
- Have OAuth settings integrated into Product pages (not separate)
- Require special permissions or access levels
- Have changed their portal structure recently
- Hide OAuth settings behind specific navigation paths

**The fact that you have a Client ID means the OAuth app exists - we just need to find where Riot has placed the management interface!**
