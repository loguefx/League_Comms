# Navigate from API Test Page to OAuth Settings

## You're Currently On

You're on an **API testing page** - this is for testing API calls, not managing OAuth settings.

## Step 1: Go Back to the Main Application Page

1. **Look for a "Back" button** or navigation breadcrumbs
2. **Or go directly to**: `https://developer.riotgames.com/app/729699/apis`
3. This should take you back to the API methods listing page

## Step 2: From API Methods Page, Look for Navigation

Once you're back on `/app/729699/apis`:

### Option A: Check Left Sidebar
1. **Look at the left sidebar** (dark red area)
2. **Scroll down** - there might be more items below "DEVELOPMENT API KEY"
3. Look for:
   - "Overview"
   - "Settings"
   - "OAuth" or "RSO"
   - "Credentials"
   - "Application Details"

### Option B: Check Top Navigation
1. **Look at the top of the page** (above the API methods list)
2. **Look for tabs** or buttons like:
   - "APIs" (you're here)
   - "Settings"
   - "OAuth"
   - "Overview"
   - "Details"

### Option C: Try URL Variations
In the address bar, try changing `/apis` to:

```
https://developer.riotgames.com/app/729699/settings
https://developer.riotgames.com/app/729699/oauth
https://developer.riotgames.com/app/729699/overview
https://developer.riotgames.com/app/729699
```

## Step 3: If You Can't Find OAuth Settings

Since we've tried:
- ❌ `/app/729699` (404)
- ❌ `/oauth2/applications` (404)
- ❌ `/applications` (404)
- ❌ `/my-applications` (404)
- ❌ All standard OAuth URLs (404)

**OAuth settings might not be accessible through the web portal**, or they might require:
- Special permissions
- A different account type
- Contact with Riot Support

## Step 4: Contact Riot Support (RECOMMENDED)

Since all navigation paths have failed, **contact Riot Support directly**:

1. **Go to**: `https://developer.riotgames.com/support`
2. **Or click "SUPPORT"** in the top navigation (red link)
3. **Ask this question**:
   ```
   I have Product ID 729699 and Client ID 795190. 
   I need to add an OAuth Redirect URI: 
   http://192.168.0.159:4000/auth/riot/callback
   
   Where do I manage OAuth Redirect URIs in the Developer Portal?
   All standard OAuth URLs give 404 errors.
   ```
4. **Provide**:
   - Product ID: `729699`
   - Client ID: `795190`
   - Your redirect URI: `http://192.168.0.159:4000/auth/riot/callback`

## Alternative: Check Riot's Documentation

1. **Go to**: `https://developer.riotgames.com/docs`
2. **Search for**: "RSO OAuth", "Riot Sign On", "OAuth Redirect URI"
3. The documentation should explain:
   - Where to manage OAuth applications
   - How to add redirect URIs
   - The correct navigation path

## What We Know

- ✅ You have Client ID: `795190` (OAuth app exists)
- ✅ You have Product ID: `729699` (Product exists)
- ✅ You can access `/app/729699/apis` (API methods page works)
- ❌ All OAuth management URLs give 404
- ❌ `/app/729699` (without `/apis`) gives 404

## Most Likely Scenario

Riot's OAuth application management might be:
1. **Hidden in a non-obvious location** on the Product page
2. **Only accessible through Riot Support** (they add it for you)
3. **Managed through their API** (not the web portal)
4. **Requires special account permissions** you don't have yet

## Next Steps

1. **Go back to** `/app/729699/apis`
2. **Carefully examine** the left sidebar and top navigation
3. **Try the URL variations** listed above
4. **If nothing works**: Contact Riot Support - they can tell you exactly where OAuth settings are or add the redirect URI for you

The OAuth application exists (you have Client ID `795190`), so the settings are somewhere - we just need Riot's help to find them!
