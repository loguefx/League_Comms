# Build API First Before Starting Dev

## The Problem
TypeScript compilation succeeded (0 errors), but `dist/main.js` doesn't exist. The build needs to actually emit the JavaScript files.

## Solution: Build API Explicitly

### Step 1: Stop Current Dev Process

Press `Ctrl+C` to stop the current `npm run dev` process.

### Step 2: Build API Explicitly

```bash
cd ~/League_Comms/apps/api
npm run build
```

### Step 3: Verify Build Output

```bash
# Check dist folder exists
ls -la dist/

# Should see:
# - main.js
# - main.d.ts
# - Other compiled files
```

### Step 4: Start Dev Again

```bash
# Go back to root
cd ~/League_Comms

# Start dev (now dist/main.js exists)
npm run dev
```

## Why This Happens

`nest start --watch` expects `dist/main.js` to exist. Even though TypeScript compilation reports 0 errors, the actual JavaScript files might not have been emitted yet.

## Complete Sequence

```bash
# 1. Stop dev (Ctrl+C if running)

# 2. Build API
cd ~/League_Comms/apps/api
npm run build

# 3. Verify
ls dist
# Should see main.js

# 4. Start dev
cd ~/League_Comms
npm run dev
```

## After Dev Starts

You should see:
- ✅ API server: http://localhost:4000
- ✅ Web app: http://localhost:3000

Open http://localhost:3000 in your browser!

## If Build Fails

If `npm run build` fails, check:
- Are there any error messages?
- Does the `dist` folder get created at all?
- Try: `rm -rf dist && npm run build`
