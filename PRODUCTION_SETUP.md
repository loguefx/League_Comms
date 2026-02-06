# Production Setup Guide

## How This Works for Everyone

### ✅ Yes, This Will Work for Everyone Who Installs It!

Once you configure the Riot API credentials, **anyone who installs your app can use it** to link their Riot account and access all features.

## How It Works

### Application-Level Credentials (Shared by All Users)

The Riot API credentials you configure are **application-level**, not user-level:

- **RIOT_CLIENT_ID** - Your app's OAuth client ID (shared by all users)
- **RIOT_CLIENT_SECRET** - Your app's OAuth client secret (shared by all users)  
- **RIOT_API_KEY** - Your app's API key (shared by all users)

When a user installs your app and links their Riot account:
1. They authenticate with Riot using **your** Client ID
2. Riot redirects back to your app with an authorization code
3. Your app exchanges the code for tokens using **your** Client Secret
4. Your app uses **your** API Key to fetch match data, summoner info, etc.

**All users share the same credentials** - this is how OAuth applications work!

## Important Considerations

### 1. Rate Limits

⚠️ **All users share the same rate limits!**

- Development API Key: 100 requests per 2 minutes per endpoint
- Production API Key: 100 requests per 2 minutes per endpoint

**Solution**: The app includes rate limiting and caching to prevent exceeding limits. For high traffic, consider:
- Request queuing
- Aggressive caching
- Multiple API keys (requires Riot approval)

### 2. Production API Key

For production, you **must** use a **Production API Key** (not Development key):

- Development keys expire after 24 hours
- Production keys don't expire (but can be revoked)
- Production keys require Riot approval

**How to get Production API Key:**
1. Go to https://developer.riotgames.com/
2. Create your application
3. Request Production API Key (may require approval)
4. Use Production key in your `.env` file

### 3. Redirect URIs

For production, you may need different redirect URIs:

**Web App:**
```
https://yourdomain.com/auth/callback
```

**Desktop App:**
```
league-voice://auth/callback
```

**Development:**
```
http://localhost:4000/auth/riot/callback
```

Register **all** redirect URIs in your Riot Developer Portal application settings.

### 4. Environment Variables in Production

**Never commit `.env` to Git!** (It's already in `.gitignore`)

For production deployment:
- Use environment variables from your hosting provider
- Or use a secrets management service (AWS Secrets Manager, etc.)
- Never hardcode credentials in your code

## Setup for Production

### Step 1: Get Production Credentials

1. Go to https://developer.riotgames.com/
2. Create/configure your application
3. Request **Production API Key** (if needed)
4. Add all redirect URIs (web + desktop)
5. Copy your credentials

### Step 2: Configure Production Environment

**Option A: Environment Variables (Recommended)**

Set these in your hosting provider:
- Heroku: `heroku config:set RIOT_CLIENT_ID=...`
- AWS: Use Secrets Manager
- Vercel: Environment Variables in dashboard
- Docker: Use `-e` flags or `.env` file

**Option B: .env File (For Self-Hosted)**

```env
# Production values
RIOT_CLIENT_ID=your-production-client-id
RIOT_CLIENT_SECRET=your-production-client-secret
RIOT_API_KEY=your-production-api-key
RIOT_REDIRECT_URI=https://yourdomain.com/auth/riot/callback

# Use PostgreSQL in production
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Use Redis in production
USE_REDIS=true
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Strong secrets in production
JWT_SECRET=your-strong-random-secret-here
ENCRYPTION_KEY=your-strong-random-encryption-key-here
```

### Step 3: Deploy

1. Build the application: `npm run build`
2. Deploy to your hosting provider
3. Set environment variables
4. Start the application

## Distribution

### For End Users

When users install your app:

1. **They don't need Riot API credentials** - you've already configured them
2. **They just need to link their Riot account** - the app handles authentication
3. **Everything works automatically** - match detection, stats, voice, etc.

### What Users See

1. User opens your app
2. Clicks "Link Riot Account"
3. Redirected to Riot login (using your Client ID)
4. User logs in with their Riot account
5. Redirected back to your app
6. App now has access to their match data, live games, etc.

**Users never see or need your API credentials!**

## Security Best Practices

1. ✅ **Never commit `.env` to Git** (already in `.gitignore`)
2. ✅ **Use strong secrets** in production (`JWT_SECRET`, `ENCRYPTION_KEY`)
3. ✅ **Rotate credentials** if compromised
4. ✅ **Monitor rate limits** to prevent abuse
5. ✅ **Use HTTPS** in production (required for OAuth)
6. ✅ **Validate redirect URIs** to prevent redirect attacks

## Testing Production Setup

### Test Locally with Production Credentials

1. Get production credentials from Riot Developer Portal
2. Add them to your local `.env` file
3. Test the full OAuth flow
4. Verify match data fetching works
5. Test rate limiting

### Test with Multiple Users

1. Have multiple people install your app
2. Each links their own Riot account
3. Verify all users can access their own data
4. Monitor rate limits

## Troubleshooting

### "Invalid client credentials"
- Check that Client ID and Secret match your Riot Developer Portal
- Make sure you're using production credentials (not dev)

### "Invalid API key"
- Production keys don't expire, but can be revoked
- Check your Riot Developer Portal for key status
- Request a new key if needed

### "Redirect URI mismatch"
- Make sure the redirect URI in `.env` matches exactly what's registered
- Check for trailing slashes, http vs https, etc.

### Rate limit errors
- Implement more aggressive caching
- Consider request queuing
- Request higher limits from Riot (if approved)

## Summary

✅ **Yes, this works for everyone!**  
✅ Configure Riot API credentials once  
✅ All users share the same credentials (application-level)  
✅ Users just link their Riot account  
✅ Use Production API Key for production  
✅ Monitor rate limits  
✅ Never commit credentials to Git  

Your app is ready for distribution! 🚀
