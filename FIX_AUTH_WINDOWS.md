# Fix GitHub Authentication on Windows

## Problem
GitHub no longer accepts passwords. You need a Personal Access Token.

## Solution: Create and Use Personal Access Token

### Step 1: Create Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `League Comms`
4. Expiration: `90 days` (or `No expiration`)
5. **Check scope**: ✅ `repo` (Full control of private repositories)
6. Click **"Generate token"**
7. **COPY THE TOKEN** (looks like `ghp_xxxxxxxxxxxxx`)

### Step 2: Push Using Token

In PowerShell:

```powershell
cd D:\League_Voice_comm

# Try to push
git push origin main
```

When prompted:
- **Username**: `loguefx`
- **Password**: [Paste your Personal Access Token - NOT your GitHub password]

### Step 3: Git Will Remember (Windows)

Windows Git Credential Manager will save the token, so you won't need to enter it again.

## Alternative: Use Token in URL (One-Time)

If you want to avoid prompts:

```powershell
# Replace YOUR_TOKEN with your actual token
git remote set-url origin https://loguefx:YOUR_TOKEN@github.com/loguefx/League_Comms.git

# Now push
git push origin main
```

**Note:** Token will be saved in Git config. Less secure but convenient.

## Verify It Worked

After pushing, check:
https://github.com/loguefx/League_Comms

You should see all your files!

## If Still Having Issues

### Clear Saved Credentials

```powershell
# Clear Windows credential manager
git credential-manager-core erase
# Then enter: https://github.com

# Or manually delete from:
# Control Panel → Credential Manager → Windows Credentials
# Find github.com and delete
```

### Use SSH Instead

If tokens don't work, set up SSH:

1. Generate SSH key in PowerShell:
```powershell
ssh-keygen -t ed25519 -C "your-email@example.com"
```

2. Add key to GitHub: https://github.com/settings/keys

3. Change remote:
```powershell
git remote set-url origin git@github.com:loguefx/League_Comms.git
git push origin main
```
