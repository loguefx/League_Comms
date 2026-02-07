# Finding OAuth Settings on the API Page

## What You're Seeing

You're on: `https://developer.riotgames.com/app/729699/apis`

- Left sidebar shows: **"DEVELOPMENT API KEY"** (highlighted in red)
- Main content: API methods and rate limits
- No visible OAuth settings

## Step 1: Check the Left Sidebar More Carefully

The left sidebar might have **more items** below "DEVELOPMENT API KEY":

1. **Scroll down** in the left sidebar (dark red area)
2. Look for other items like:
   - "Overview"
   - "Settings"
   - "OAuth" or "RSO"
   - "Credentials"
   - "Configuration"
   - "Application Details"
3. **Click each item** to see if OAuth settings appear

## Step 2: Check the Top Navigation

Look at the **top of the page** (above the main content):

1. **Look for tabs** (like "APIs", "Settings", "OAuth", "Overview")
2. **Look for a dropdown menu** (three dots "..." or "More")
3. **Look for buttons** like:
   - "Edit"
   - "Settings" (gear icon ⚙️)
   - "Manage"
   - "Configure"

## Step 3: Check the Header Area

Look at the **header** (where it says "DEVELOPMENT KEY HAS ACCESS TO 60 METHODS"):

1. **Look for buttons** on the right side of the header
2. **Look for a "Settings" icon** or link
3. **Look for "Edit" or "Manage"** buttons

## Step 4: Check the URL Structure

Try modifying the URL directly:

1. Change `/apis` to `/settings`:
   ```
   https://developer.riotgames.com/app/729699/settings
   ```

2. Change `/apis` to `/oauth`:
   ```
   https://developer.riotgames.com/app/729699/oauth
   ```

3. Change `/apis` to `/overview`:
   ```
   https://developer.riotgames.com/app/729699/overview
   ```

4. Change `/apis` to `/credentials`:
   ```
   https://developer.riotgames.com/app/729699/credentials
   ```

## Step 5: Use Browser Developer Tools

1. **Press F12** (open Developer Tools)
2. Go to **"Elements"** tab
3. **Expand the left sidebar** in the HTML:
   - Look for `<nav>`, `<aside>`, or `<ul>` elements
   - Look for links with text like "Settings", "OAuth", "RSO"
4. **Right-click** on any OAuth-related element → **"Inspect"**
5. See if it's a hidden or disabled link

## Step 6: Check if OAuth is Managed Elsewhere

Since all OAuth URLs give 404, OAuth might be:

1. **Managed through Riot's API** (not the web portal)
2. **Requires special permissions** (contact Riot Support)
3. **Only accessible during application creation** (can't modify later)
4. **In a completely different portal** (separate from Developer Portal)

## Step 7: Contact Riot Support (If Nothing Works)

If you can't find OAuth settings anywhere:

1. Click **"SUPPORT"** (red link in top navigation)
2. Or go to: `https://developer.riotgames.com/support`
3. Ask: **"I have Product ID 729699 and Client ID 795190. How do I add OAuth Redirect URIs?"**
4. Provide:
   - Product ID: `729699`
   - Client ID: `795190`
   - Redirect URI needed: `http://192.168.0.159:4000/auth/riot/callback`

## What to Look For

When you find OAuth settings, you should see:
- **"OAuth Redirect URIs"** or **"Redirect URIs"** section
- A list of existing URIs (might be empty)
- An **"Add"** or **"Add Redirect URI"** button
- An input field to enter a new URI

## Quick Action Items

- [ ] Scroll down in left sidebar - look for other navigation items
- [ ] Check top of page for tabs or buttons
- [ ] Try URL variations: `/settings`, `/oauth`, `/overview`, `/credentials`
- [ ] Use F12 → Elements tab → Search for "oauth" or "redirect"
- [ ] Contact Riot Support if nothing works

## Important Note

The fact that you have Client ID `795190` means the OAuth application exists. The settings are somewhere - we just need to find where Riot has placed them in their portal interface.
