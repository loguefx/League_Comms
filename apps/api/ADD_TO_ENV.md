# Add These Lines to Your .env File

Copy and paste these lines into your existing `.env` file in `apps/api/`:

```env
# ============================================
# RIOT API RATE LIMITING CONFIGURATION
# ============================================
# Enable/disable rate limiting (default: true)
# Set to 'false' only if you have a production API key with higher limits
RIOT_RATE_LIMIT_ENABLED=true

# Delay between individual API requests (milliseconds)
# Default: 100ms (allows up to 10 requests/second, well under 20/sec limit)
RIOT_REQUEST_DELAY_MS=100

# Delay between batches of players (milliseconds)
# Default: 2000ms (2 seconds between batches)
RIOT_BATCH_DELAY_MS=2000

# Initial retry delay for 429 rate limit errors (milliseconds)
# Uses exponential backoff: 5s, 10s, 20s, etc.
RIOT_RETRY_DELAY_MS=5000

# Maximum number of retries for 429 errors
RIOT_MAX_RETRIES=3
```

## Quick Copy-Paste (Just the Variables)

If you just want the variables without comments:

```env
RIOT_RATE_LIMIT_ENABLED=true
RIOT_REQUEST_DELAY_MS=100
RIOT_BATCH_DELAY_MS=2000
RIOT_RETRY_DELAY_MS=5000
RIOT_MAX_RETRIES=3
```

## Where to Add Them

Add these lines anywhere in your `.env` file. I recommend adding them after your `RIOT_API_KEY` line for organization.

## After Adding

1. Save the file
2. Restart your dev server (`npm run dev`)
3. You should see a log message: `Rate limiting ENABLED: 100ms between requests, 2000ms between batches`
