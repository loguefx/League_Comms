# Build Commands - From Any Directory

## You're Currently In: `packages/riot`

### Option 1: Go Back to Root First

```bash
# Go back to project root
cd ../..

# Now you're in ~/League_Comms
# Build shared
cd packages/shared && npm run build && cd ../..

# Build riot
cd packages/riot && npm run build && cd ../..
```

### Option 2: Use Relative Paths (From packages/riot)

```bash
# You're in packages/riot, so go to shared like this:
cd ../shared && npm run build && cd ../..

# Now you're back at root, build riot
cd packages/riot && npm run build && cd ../..
```

### Option 3: One Command from Root

```bash
# First, go to project root
cd ~/League_Comms

# Then build both
cd packages/shared && npm run build && cd ../..
cd packages/riot && npm run build && cd ../..
```

## Quick Fix for Your Current Situation

Since you're in `packages/riot`, run:

```bash
# Go back to project root
cd ../..

# Verify you're in the right place
pwd
# Should show: /home/vboxuser/League_Comms

# Build shared
cd packages/shared && npm run build && cd ../..

# Build riot
cd packages/riot && npm run build && cd ../..

# Build everything
npm run build
```

## Always Start from Project Root

The easiest way is to always start from the project root:

```bash
# Go to project root
cd ~/League_Comms

# Build shared
cd packages/shared && npm run build && cd ../..

# Build riot  
cd packages/riot && npm run build && cd ../..

# Build all
npm run build
```
