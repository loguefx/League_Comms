# What to Put for Product URL in Riot Developer Portal

## For Development (Now)

Since you're setting up for development/testing, use:

```
http://localhost:3000
```

This is your web app URL (the frontend that users will interact with).

## Alternative Development URLs

If you want to be more specific, you could also use:
- `http://localhost:3000` (Web app - recommended)
- `http://localhost:4000` (API server - less common for Product URL)

**Recommendation**: Use `http://localhost:3000` since that's what users will see.

## For Production (Later)

When you deploy your app, you'll need to update this to your actual domain:

```
https://yourdomain.com
```

Or if you're using a service:
- `https://your-app.vercel.app`
- `https://your-app.herokuapp.com`
- `https://your-app.netlify.app`
- etc.

## Important Notes

### The Product URL Field

- This field is typically **optional** (no asterisk *)
- It's used by Riot to identify your product
- It doesn't need to match your redirect URI exactly
- You can update it later when you deploy

### Redirect URI vs Product URL

These are **different**:

- **Product URL**: Where your app is hosted (for identification)
  - Development: `http://localhost:3000`
  - Production: `https://yourdomain.com`

- **Redirect URI**: Where Riot sends users after OAuth login
  - Development: `http://localhost:4000/auth/riot/callback`
  - Production: `https://yourdomain.com/auth/riot/callback`

## Quick Answer

**For now, just put:**
```
http://localhost:3000
```

You can always update it later when you deploy to production!

## Complete Form Checklist

When filling out the Riot Developer Portal form:

- ✅ **Product Group**: Default Group (or create a new one)
- ✅ **Product URL**: `http://localhost:3000`
- ✅ **Product Game Focus**: League of Legends
- ✅ **reCAPTCHA**: Check the box
- ✅ Click **NEXT**

Then on the next page, you'll configure:
- App Name
- Description
- Redirect URIs
- Scopes
- And get your Client ID, Client Secret, and API Key!
