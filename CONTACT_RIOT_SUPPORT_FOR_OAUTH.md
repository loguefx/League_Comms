# Contact Riot Support for OAuth Redirect URI

## Situation Summary

We've tried **everything** and all paths give 404:

- ❌ `/app/729699` (404)
- ❌ `/app/729699/apis` (works, but no OAuth settings)
- ❌ `/app/729699/oauth` (404)
- ❌ `/app/729699/settings` (404)
- ❌ `/app/729699/overview` (404)
- ❌ `/oauth2/applications` (404)
- ❌ `/applications` (404)
- ❌ `/my-applications` (404)

**Conclusion**: OAuth application management is **not accessible** through standard web portal navigation.

## What We Know

- ✅ **Product ID**: `729699` (exists, you can access `/apis`)
- ✅ **Client ID**: `795190` (OAuth application exists)
- ✅ **Redirect URI needed**: `http://192.168.0.159:4000/auth/riot/callback`
- ❌ **OAuth management interface**: Not accessible through web portal

## Solution: Contact Riot Support

Since all navigation paths have failed, **Riot Support** is your best option. They can:
1. Tell you where OAuth settings are located
2. Add the redirect URI for you directly
3. Verify your OAuth application setup

## How to Contact Riot Support

### Step 1: Go to Support Page

1. **Click "SUPPORT"** (red link in top navigation on any Riot Developer Portal page)
2. **Or go directly to**: `https://developer.riotgames.com/support`

### Step 2: Submit Your Request

**Subject**: "Need to add OAuth Redirect URI - Cannot find OAuth settings"

**Message** (copy and paste this):

```
Hello Riot Support,

I have registered a Product (ID: 729699) and an OAuth Application (Client ID: 795190) 
in the Riot Developer Portal.

I need to add an OAuth Redirect URI, but I cannot find where to manage OAuth settings 
in the Developer Portal. All standard OAuth URLs give 404 errors:
- /app/729699/oauth (404)
- /app/729699/settings (404)
- /oauth2/applications (404)
- /applications (404)

Could you please:
1. Tell me where to find OAuth Redirect URI settings in the portal, OR
2. Add this redirect URI to my OAuth application:
   http://192.168.0.159:4000/auth/riot/callback

My details:
- Product ID: 729699
- OAuth Client ID: 795190
- Redirect URI needed: http://192.168.0.159:4000/auth/riot/callback

Thank you!
```

### Step 3: Provide Additional Information

If there's a form, also provide:
- **Your Riot Account**: LOGUEFX702
- **Product Name**: League Comm Companion (or whatever you named it)
- **Application Type**: Web Application
- **Purpose**: League of Legends companion app with OAuth authentication

## Alternative: Check Riot's Documentation One More Time

Before contacting support, try:

1. **Go to**: `https://developer.riotgames.com/docs`
2. **Search for**:
   - "RSO OAuth"
   - "Riot Sign On Redirect URI"
   - "OAuth Application Management"
   - "How to add OAuth Redirect URI"
3. **Look for**:
   - Step-by-step guides
   - Screenshots showing where OAuth settings are
   - API documentation for managing OAuth apps

## What to Expect from Riot Support

Riot Support should:
- Respond within 1-3 business days
- Either guide you to the correct location OR
- Add the redirect URI for you directly
- Verify your OAuth application is set up correctly

## While Waiting for Support

You can continue working on other parts of your application:
- ✅ API is working (you can access `/app/729699/apis`)
- ✅ You have Client ID and Secret (in your `.env`)
- ✅ Your backend code is ready
- ⏳ Just need the redirect URI registered

Once Riot adds the redirect URI, your OAuth flow should work immediately!

## Important Notes

- **Redirect URI must match EXACTLY**: `http://192.168.0.159:4000/auth/riot/callback`
- **No trailing slash**: Don't add `/` at the end
- **Case-sensitive**: Must match exactly what's in your `.env` file
- **Wait 1-2 minutes**: After Riot adds it, wait a moment for their servers to update

## Summary

**Action Required**: Contact Riot Support to add your OAuth Redirect URI.

**Why**: All standard navigation paths to OAuth settings give 404 errors, indicating the management interface is either:
- In a non-standard location
- Requires special permissions
- Only accessible through Riot Support
- Managed through a different system

**Next Step**: Go to `https://developer.riotgames.com/support` and submit the request above.
