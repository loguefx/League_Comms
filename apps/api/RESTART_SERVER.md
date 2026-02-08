# Restart API Server to Register New Routes

## The Problem

You're getting `404 Cannot POST /champions/aggregate` because:
- The endpoint code exists in the file
- But the server was started BEFORE the endpoint was added
- NestJS needs a restart to register new routes

## The Solution

### Step 1: Stop the Server

In the terminal where `npm run dev` is running:
- Press `Ctrl+C` to stop the server

### Step 2: Restart the Server

```bash
cd apps/api
npm run dev
```

Or from project root:
```bash
npm run dev
```

### Step 3: Verify the Route is Registered

Look for this in the startup logs:
```
Mapped {/champions/aggregate, POST} route
```

### Step 4: Try Again

After restart, the endpoint should work:
```cmd
curl -X POST "http://192.168.0.159:4000/champions/aggregate"
```

## Why This Happens

NestJS scans controllers at startup and registers all routes. If you add a new route while the server is running, it won't be available until you restart.

## Quick Check

After restarting, you should see in the logs:
- All the `/champions/*` routes mapped
- Including `{/champions/aggregate, POST}`

Then the aggregation endpoint will work!
