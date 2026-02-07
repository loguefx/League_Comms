# Quickest Way to Clone - 3 Options

## 🚀 Fastest: Make Repository Public

**Takes 30 seconds, no authentication needed:**

1. Go to: https://github.com/loguefx/League_Comms/settings
2. Scroll to "Danger Zone"
3. Click "Change visibility" → "Make public"
4. Clone:

```bash
git clone https://github.com/loguefx/League_Comms.git
cd League_Comms
```

**Done! No username/password needed.**

## 🔐 Most Secure: SSH Keys (2 Minutes Setup)

**One-time setup, then never enter password again:**

```bash
# 1. Generate SSH key (press Enter 3 times)
ssh-keygen -t ed25519 -C "your-email@example.com"

# 2. Copy public key
cat ~/.ssh/id_ed25519.pub
# Copy the entire output

# 3. Add to GitHub:
#    Go to: https://github.com/settings/keys
#    Click "New SSH key"
#    Paste your public key
#    Save

# 4. Clone (no password needed!)
git clone git@github.com:loguefx/League_Comms.git
cd League_Comms
```

## 💾 Save Token Once: Credential Helper

**Enter token once, Git remembers it:**

```bash
# Configure Git to save credentials
git config --global credential.helper store

# Clone (enter token once)
git clone https://github.com/loguefx/League_Comms.git
# Username: loguefx
# Password: [paste your token]

# All future clones won't need credentials!
```

## Which Should You Use?

- **Need it NOW?** → Make repository public (30 seconds)
- **Want it secure?** → Use SSH keys (2 minutes, one-time)
- **Have a token?** → Use credential helper (1 minute)

## After Cloning

```bash
cd League_Comms
chmod +x setup-linux.sh
./setup-linux.sh
```
