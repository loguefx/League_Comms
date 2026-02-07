# Exact Build Commands - Copy These

## Run These Commands One at a Time

### 1. Go to Project Root
```bash
cd ~/League_Comms
```

### 2. Build Shared Package (MUST BE FIRST!)
```bash
cd packages/shared && npm run build && cd ../..
```

**Wait for this to finish!** Look for "Successfully compiled" or similar.

### 3. Check Shared Built Successfully
```bash
ls packages/shared/dist
```

If you see files, good! If not, shared build failed - check errors.

### 4. Build Riot Package
```bash
cd packages/riot && npm run build && cd ../..
```

This should work now!

### 5. Build Everything
```bash
npm run build
```

## Important Notes

- **Order matters**: Shared MUST be built before Riot
- **Wait for completion**: Don't run the next command until the previous one finishes
- **Check for errors**: If a build fails, fix that before continuing

## If You Get Errors

### Shared Build Fails
```bash
cd packages/shared
npm run build
# Read the error messages
# Usually: missing dependencies or TypeScript errors
```

### Riot Still Fails After Shared Builds
```bash
# Make sure shared/dist exists
ls packages/shared/dist

# If it doesn't exist, shared didn't build
# Go back and fix shared build first
```

## Success Looks Like

After step 2, you should see:
```
> @league-voice/shared@0.1.0 build
> tsc

# No errors!
```

After step 4, you should see:
```
> @league-voice/riot@0.1.0 build
> tsc

# No errors!
```
