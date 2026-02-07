# Simple Push Instructions

Your repository: https://github.com/loguefx/League_Comms.git

## Quick Push (3 Steps)

### Step 1: Configure Git (One-time, if not done)

Open PowerShell and run:

```powershell
git config --global user.name "loguefx"
git config --global user.email "your-email@example.com"
```

**Use the email associated with your GitHub account.**

### Step 2: Run Push Script

```powershell
cd D:\League_Voice_comm
.\PUSH_COMMANDS.ps1
```

### Step 3: If Authentication Required

When prompted for password, use a **Personal Access Token**:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: "League Comms"
4. Select scope: `repo` ✓
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. When `git push` asks for password, paste the token

## Manual Push (If Script Doesn't Work)

```powershell
cd D:\League_Voice_comm

# Add all files
git add .

# Create commit
git commit -m "Initial commit: League Voice Companion"

# Push to GitHub
git push -u origin main
```

## Verify

After pushing, check:
https://github.com/loguefx/League_Comms

You should see all your files!
