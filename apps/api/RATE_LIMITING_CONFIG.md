# Rate Limiting Configuration

This document explains how to configure rate limiting for Riot API calls.

## Overview

The rate limiter respects Riot API limits:
- **20 requests per second** (per routing value)
- **100 requests per 2 minutes** (per routing value)

## Configuration Options

Add these to your `.env` file:

### `RIOT_RATE_LIMIT_ENABLED`

- **Type:** `boolean` (string: `"true"` or `"false"`)
- **Default:** `true`
- **Description:** Enable or disable rate limiting
- **Usage:**
  - `true` - Use for development/testing API keys (limited rate limits)
  - `false` - Use only with production API keys (higher rate limits)

### `RIOT_REQUEST_DELAY_MS`

- **Type:** `number` (milliseconds)
- **Default:** `100`
- **Description:** Delay between individual API requests
- **Calculation:** 
  - 100ms = 10 requests/second (safe for 20/sec limit)
  - 50ms = 20 requests/second (at the limit, not recommended)
  - 200ms = 5 requests/second (very conservative)

### `RIOT_BATCH_DELAY_MS`

- **Type:** `number` (milliseconds)
- **Default:** `2000`
- **Description:** Delay between batches of players
- **Usage:** Gives the system time to process and prevents overwhelming the API

### `RIOT_RETRY_DELAY_MS`

- **Type:** `number` (milliseconds)
- **Default:** `5000`
- **Description:** Initial delay when a 429 (rate limit) error occurs
- **Behavior:** Uses exponential backoff (5s, 10s, 20s, etc.)

### `RIOT_MAX_RETRIES`

- **Type:** `number`
- **Default:** `3`
- **Description:** Maximum number of retries for 429 errors before giving up

## Example Configurations

### Development/Testing (Limited API Key)

```env
RIOT_RATE_LIMIT_ENABLED=true
RIOT_REQUEST_DELAY_MS=100
RIOT_BATCH_DELAY_MS=2000
RIOT_RETRY_DELAY_MS=5000
RIOT_MAX_RETRIES=3
```

This configuration:
- Waits 100ms between requests (10 req/sec)
- Waits 2 seconds between batches
- Retries 429 errors with exponential backoff

### Production (High-Rate API Key)

```env
RIOT_RATE_LIMIT_ENABLED=false
```

This disables rate limiting entirely. **Only use this if you have a production API key with higher rate limits.**

### Conservative (Very Limited API Key)

```env
RIOT_RATE_LIMIT_ENABLED=true
RIOT_REQUEST_DELAY_MS=200
RIOT_BATCH_DELAY_MS=5000
RIOT_RETRY_DELAY_MS=10000
RIOT_MAX_RETRIES=5
```

This configuration:
- Waits 200ms between requests (5 req/sec)
- Waits 5 seconds between batches
- More aggressive retry strategy

## How It Works

1. **Request Delays:** Before each API call, the system waits the configured delay
2. **2-Minute Window Tracking:** Tracks requests in a 2-minute sliding window
3. **Automatic Throttling:** If approaching 100 requests in 2 minutes, automatically waits
4. **429 Error Handling:** Automatically retries with exponential backoff

## Monitoring

The rate limiter logs:
- When rate limiting is enabled/disabled
- Warnings when approaching 2-minute limits
- Retry attempts for 429 errors

Look for these log messages:
```
Rate limiting ENABLED: 100ms between requests, 2000ms between batches
Approaching 2-minute rate limit (90/100), waiting 5000ms
Rate limit hit (429), waiting 5000ms before retry 1/3
```

## Troubleshooting

### Still Getting 429 Errors?

1. Increase `RIOT_REQUEST_DELAY_MS` (try 200ms or 300ms)
2. Increase `RIOT_BATCH_DELAY_MS` (try 5000ms)
3. Reduce batch size in your seeding calls

### Too Slow?

1. If you have a production API key, set `RIOT_RATE_LIMIT_ENABLED=false`
2. Reduce `RIOT_REQUEST_DELAY_MS` (but stay above 50ms to respect 20/sec limit)
3. Reduce `RIOT_BATCH_DELAY_MS`
