# Fix Git Pull Conflict

## The Problem

Git pull is failing because you have local changes to `setup-linux.sh` that conflict with incoming changes.

## Quick Fix Options

### Option 1: Stash Your Changes (Recommended)

If your local changes to `setup-linux.sh` aren't important:

```bash
# Stash your local changes
git stash

# Now pull
git pull origin main

# Your changes are saved in stash if you need them later
# To see what was stashed: git stash show
# To restore: git stash pop
```

### Option 2: Commit Your Changes

If you want to keep your local changes:

```bash
# See what changed
git diff setup-linux.sh

# If you want to keep the changes, commit them
git add setup-linux.sh
git commit -m "Local changes to setup-linux.sh"

# Then pull (may need to merge)
git pull origin main
```

### Option 3: Discard Local Changes

If you don't need your local changes:

```bash
# Discard changes to setup-linux.sh
git checkout -- setup-linux.sh

# Now pull
git pull origin main
```

## Recommended: Stash and Pull

```bash
# 1. Stash local changes
git stash

# 2. Pull latest fixes
git pull origin main

# 3. Create .env file (from root!)
npm run create-env

# 4. Rebuild API
cd apps/api
npm run build

# 5. Start dev
cd ~/League_Comms
npm run dev
```

## What Changed in setup-linux.sh

The latest version includes automatic `.env` file creation using the `create-env.js` script, so you probably want the updated version.
