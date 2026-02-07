# How to Use GitHub Token Securely

## ⚠️ IMPORTANT: Never Share Your Token

Your token is like a password. Keep it secret!

## Method 1: Use Token When Prompted (Recommended)

### On Linux (Clone):
```bash
git clone https://github.com/loguefx/League_Comms.git
```

When prompted:
- **Username**: `loguefx`
- **Password**: [Paste your token - it won't show on screen]

Git will remember it for future operations.

### On Windows (Push):
```powershell
git push origin main
```

When prompted:
- **Username**: `loguefx`
- **Password**: [Paste your token]

Windows Git Credential Manager will save it.

## Method 2: Store Token in Git Config (Less Secure)

### Linux:
```bash
# Store token in Git config (visible in .git/config)
git config --global credential.helper store

# Then clone/push normally
git clone https://github.com/loguefx/League_Comms.git
# Enter token once, it's saved
```

### Windows:
Token is automatically saved by Git Credential Manager.

## Method 3: Use SSH Keys (Most Secure)

No tokens needed!

### Generate SSH Key:
```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
# Press Enter for defaults
```

### Add to GitHub:
1. Display key: `cat ~/.ssh/id_ed25519.pub`
2. Copy the output
3. Go to: https://github.com/settings/keys
4. Add new SSH key
5. Paste your public key

### Clone with SSH:
```bash
git clone git@github.com:loguefx/League_Comms.git
# No password needed!
```

## Best Practices

1. ✅ Use token only when Git prompts
2. ✅ Let Git Credential Manager remember it
3. ✅ Use SSH keys for long-term use
4. ❌ Never share tokens publicly
5. ❌ Never commit tokens to Git
6. ❌ Never paste tokens in chat/email

## If Token is Exposed

1. **Revoke immediately**: https://github.com/settings/tokens
2. **Create new token**
3. **Use new token** for all operations
4. **Consider using SSH** instead
