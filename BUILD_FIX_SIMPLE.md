# Simple Build Fix - Copy These Commands

## Run These Commands One at a Time

### Step 1: Build Shared Package
```bash
cd packages/shared && npm run build && cd ../..
```

### Step 2: Build Riot Package
```bash
cd packages/riot && npm run build && cd ../..
```

### Step 3: Build Everything
```bash
npm run build
```

## That's It!

The `&&` operator chains commands together. Each command runs only if the previous one succeeds.

## If You Get Errors

Make sure you're in the project root (`~/League_Comms`) before running these commands.

Check your location:
```bash
pwd
# Should show: /home/vboxuser/League_Comms
```

If not, go there:
```bash
cd ~/League_Comms
```

Then run the build commands above.
