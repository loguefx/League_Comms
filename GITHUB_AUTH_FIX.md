# Fix GitHub Authentication

GitHub no longer accepts passwords. You need to use a **Personal Access Token** or **SSH keys**.

## Option 1: Personal Access Token (Easiest)

### Step 1: Create Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name it: `League Comms`
4. Select expiration: `90 days` (or `No expiration` if you prefer)
5. **Select scopes** (check these boxes):
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (if you plan to use GitHub Actions)
6. Click **"Generate token"**
7. **COPY THE TOKEN** - You won't see it again! It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Use Token for Clone

When cloning, use the token as the password:

```bash
# Clone using HTTPS
git clone https://github.com/loguefx/League_Comms.git
cd League_Comms

# When prompted:
# Username: loguefx
# Password: [paste your Personal Access Token here]
```

### Step 3: Use Token for Push (Windows)

When pushing from Windows:

```powershell
cd D:\League_Voice_comm
git push origin main

# When prompted:
# Username: loguefx
# Password: [paste your Personal Access Token here]
```

## Option 2: SSH Keys (More Secure, No Password Prompts)

### Step 1: Generate SSH Key (Linux)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Press Enter to accept default location
# Press Enter for no passphrase (or set one if you want)

# Start SSH agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/id_ed25519
```

### Step 2: Add SSH Key to GitHub

```bash
# Display your public key
cat ~/.ssh/id_ed25519.pub
```

Copy the entire output (starts with `ssh-ed25519`).

1. Go to: https://github.com/settings/keys
2. Click **"New SSH key"**
3. Title: `Linux Machine`
4. Key: Paste your public key
5. Click **"Add SSH key"**

### Step 3: Change Remote to SSH

```bash
cd League_Comms
git remote set-url origin git@github.com:loguefx/League_Comms.git
```

Now you can clone/push without passwords!

## Option 3: GitHub CLI (Alternative)

```bash
# Install GitHub CLI
sudo apt install gh

# Authenticate
gh auth login

# Follow prompts:
# - GitHub.com
# - HTTPS
# - Authenticate Git with your GitHub credentials
# - Login with a web browser
```

## Quick Fix for Current Issue

### If you're trying to clone:

```bash
# Use token as password when prompted
git clone https://github.com/loguefx/League_Comms.git

# Username: loguefx
# Password: [paste your Personal Access Token]
```

### If you're trying to push from Windows:

```powershell
# Push and use token when prompted
git push origin main

# Username: loguefx
# Password: [paste your Personal Access Token]
```

## Store Credentials (Optional - Avoid Re-entering Token)

### Linux - Store in Git Credential Helper

```bash
# Store credentials for 1 hour
git config --global credential.helper 'cache --timeout=3600'

# Or store permanently (less secure)
git config --global credential.helper store
```

### Windows - Use Git Credential Manager

Windows usually has Git Credential Manager installed. It will prompt once and remember.

## Troubleshooting

### "Authentication failed"
- Make sure you're using the **token**, not your password
- Token must have `repo` scope checked
- Token must not be expired

### "Permission denied (publickey)" (SSH)
- Make sure SSH key is added to GitHub
- Test connection: `ssh -T git@github.com`
- Should say: "Hi loguefx! You've successfully authenticated..."

### "Repository not found"
- Make sure repository exists: https://github.com/loguefx/League_Comms
- Make sure token has `repo` scope
- Make sure you're using the correct username

## Recommended: Use Personal Access Token

For now, the easiest solution is:

1. **Create Personal Access Token** (see Option 1 above)
2. **Use it as password** when prompted
3. **Git Credential Manager will remember it** (on Windows)

This works immediately and doesn't require SSH setup.
