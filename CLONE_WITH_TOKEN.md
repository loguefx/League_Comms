# Clone Repository with Personal Access Token

## Step 1: Get Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `League Comms`
4. Expiration: `90 days` (or your choice)
5. **Check this scope**: ✅ `repo`
6. Click **"Generate token"**
7. **COPY THE TOKEN** (starts with `ghp_...`)

## Step 2: Clone Repository

On your Linux machine:

```bash
# Clone the repository
git clone https://github.com/loguefx/League_Comms.git
```

When prompted:
- **Username**: `loguefx`
- **Password**: [Paste your Personal Access Token here - NOT your GitHub password]

## Step 3: Continue Setup

```bash
cd League_Comms

# Make script executable
chmod +x setup-linux.sh

# Run setup
./setup-linux.sh
```

## Alternative: Clone Without Prompt (One-Liner)

If you want to avoid the prompt, you can embed the token in the URL:

```bash
# Replace YOUR_TOKEN with your actual token
git clone https://loguefx:YOUR_TOKEN@github.com/loguefx/League_Comms.git
cd League_Comms
```

**Note:** This is less secure as the token appears in command history. Use the prompt method if possible.

## After Cloning

Once cloned, continue with setup:

```bash
chmod +x setup-linux.sh
./setup-linux.sh
newgrp docker  # If Docker was just installed
nano apps/api/.env  # Add Riot API credentials
npm run dev
```
