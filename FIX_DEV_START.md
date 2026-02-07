# Fix Dev Start - Build First

## The Problem
`npm run dev` is trying to run `dist/main` but the build hasn't created it yet, or the dist folder doesn't exist.

## Solution: Build First, Then Start Dev

### Step 1: Build the API

```bash
cd ~/League_Comms/apps/api
npm run build
```

### Step 2: Verify Build Output

```bash
# Check dist folder exists
ls dist

# Should see: main.js and other files
```

### Step 3: Start Development

```bash
# Go back to root
cd ~/League_Comms

# Start dev (now dist/main.js exists)
npm run dev
```

## Alternative: Build All Packages First

```bash
# Build all packages
cd ~/League_Comms
npm run build

# Then start dev
npm run dev
```

## Why This Happens

`nest start --watch` expects `dist/main.js` to exist. If the build hasn't run yet, or if there was an issue during build, the file won't exist.

## Quick Fix Sequence

```bash
# 1. Build API first
cd ~/League_Comms/apps/api
npm run build

# 2. Verify dist exists
ls dist

# 3. Start dev from root
cd ~/League_Comms
npm run dev
```

## After Dev Starts Successfully

You should see:
- API server running on http://localhost:4000
- Web app running on http://localhost:3000

Then you can:
1. Open http://localhost:3000 in your browser
2. Test the application
