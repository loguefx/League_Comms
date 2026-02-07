# Easy Ways to Clone Repository

## Option 1: Make Repository Public (Easiest - No Auth Needed)

If you don't need the repository to be private:

1. Go to: https://github.com/loguefx/League_Comms/settings
2. Scroll down to "Danger Zone"
3. Click "Change visibility" → "Make public"
4. Now clone without any authentication:

```bash
git clone https://github.com/loguefx/League_Comms.git
cd League_Comms
```

**No username/password needed!**

## Option 2: Use SSH Keys (One-Time Setup, Then No Passwords)

### Step 1: Generate SSH Key (Linux)

```bash
# Generate SSH key (press Enter for all prompts)
ssh-keygen -t ed25519 -C "your-email@example.com"
# Press Enter 3 times (default location, no passphrase)
```

### Step 2: Add Key to GitHub

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

### Step 3: Clone with SSH

```bash
# Clone using SSH (no password needed!)
git clone git@github.com:loguefx/League_Comms.git
cd League_Comms
```

**After this one-time setup, you'll never need to enter credentials again!**

## Option 3: Use GitHub CLI (gh)

### Install GitHub CLI

```bash
# Ubuntu/Debian
sudo apt install gh

# Or download from: https://cli.github.com/
```

### Authenticate Once

```bash
# Login to GitHub
gh auth login

# Follow prompts:
# - GitHub.com
# - HTTPS
# - Authenticate Git with your GitHub credentials
# - Login with a web browser (or paste token)
```

### Clone

```bash
# Now you can clone without prompts
gh repo clone loguefx/League_Comms
cd League_Comms
```

## Option 4: Embed Token in URL (One-Time, Less Secure)

If you have a token, you can embed it in the URL:

```bash
# Replace YOUR_TOKEN with your actual token
git clone https://loguefx:YOUR_TOKEN@github.com/loguefx/League_Comms.git
cd League_Comms
```

**Note:** Token will be saved in Git config. Less secure but convenient.

## Option 5: Use Git Credential Helper (Saves Token)

```bash
# Configure Git to remember credentials
git config --global credential.helper store

# Clone (enter token once)
git clone https://github.com/loguefx/League_Comms.git
# Username: loguefx
# Password: [paste token]

# Future clones won't need credentials!
```

## Recommended: SSH Keys

**Best option for long-term use:**

1. ✅ One-time setup
2. ✅ No passwords ever again
3. ✅ More secure than tokens
4. ✅ Works for all Git operations

### Quick SSH Setup:

```bash
# 1. Generate key
ssh-keygen -t ed25519 -C "your-email@example.com"
# Press Enter 3 times

# 2. Copy public key
cat ~/.ssh/id_ed25519.pub
# Copy the output

# 3. Add to GitHub: https://github.com/settings/keys

# 4. Clone
git clone git@github.com:loguefx/League_Comms.git
```

## Quick Comparison

| Method | Setup Time | Security | Convenience |
|--------|-----------|----------|-------------|
| Public Repo | 0 min | Low | ⭐⭐⭐⭐⭐ |
| SSH Keys | 2 min | High | ⭐⭐⭐⭐⭐ |
| GitHub CLI | 3 min | High | ⭐⭐⭐⭐ |
| Token in URL | 1 min | Medium | ⭐⭐⭐ |
| Credential Helper | 1 min | Medium | ⭐⭐⭐⭐ |

## My Recommendation

**Use SSH Keys** - Takes 2 minutes to set up, then you never need to enter credentials again!

```bash
# One-time setup
ssh-keygen -t ed25519 -C "your-email@example.com"
cat ~/.ssh/id_ed25519.pub  # Copy this
# Add to GitHub: https://github.com/settings/keys

# Then clone (no password needed!)
git clone git@github.com:loguefx/League_Comms.git
```
