# Simple Build Steps - Copy These Exactly

## Step 1: Go to Project Root

```bash
cd ~/League_Comms
```

## Step 2: Build Shared Package

```bash
cd packages/shared && npm run build && cd ../..
```

Wait for it to finish.

## Step 3: Build Riot Package

```bash
cd packages/riot && npm run build && cd ../..
```

Wait for it to finish.

## Step 4: Build Everything

```bash
npm run build
```

## That's It!

Make sure you're in `~/League_Comms` (project root) before running the build commands.

## Check Your Location

If you're not sure where you are:

```bash
pwd
```

If it shows `/home/vboxuser/League_Comms/packages/riot`, go back:

```bash
cd ../..
```

Then run the build commands above.
