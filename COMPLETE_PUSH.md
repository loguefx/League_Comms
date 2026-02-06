# Complete Push to GitHub - Step by Step

Your repository: https://github.com/loguefx/League_Comms.git

## Step 1: Configure Git Identity (Required First Time)

Run these commands in PowerShell:

```powershell
# Set your name (use your GitHub username or real name)
git config --global user.name "loguefx"

# Set your email (use your GitHub email)
git config --global user.email "your-email@example.com"
```

**Important:** Use the email associated with your GitHub account.

## Step 2: Check What's Ready to Commit

```powershell
git status
```

You should see files listed as "Changes to be committed".

## Step 3: Create the Commit

```powershell
git commit -m "Initial commit: League Voice Companion - Complete monorepo with API, Web, Desktop apps"
```

## Step 4: Push to GitHub

```powershell
git push -u origin main
```

If you get authentication errors:

### Option A: Use Personal Access Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it: "League Comms"
4. Select scope: `repo` (check the box)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. When `git push` asks for password, paste the token

### Option B: Use GitHub CLI
```powershell
# Install GitHub CLI if needed
# Then authenticate
gh auth login
git push -u origin main
```

### Option C: Use SSH (More Secure)
```powershell
# Change remote to SSH
git remote set-url origin git@github.com:loguefx/League_Comms.git

# Push (will use SSH key)
git push -u origin main
```

## Step 5: Verify on GitHub

1. Go to https://github.com/loguefx/League_Comms
2. You should see all your files
3. Repository should no longer say "This repository is empty"

## Troubleshooting

### "Authentication failed"
- Use Personal Access Token (see Option A above)
- Or set up SSH keys

### "Remote origin already exists"
- That's fine, it means the remote is already configured
- Just proceed to commit and push

### "Nothing to commit"
- Run `git add .` first
- Then commit

### "Branch 'main' does not exist"
- Run `git branch -M main` first
- Then push
