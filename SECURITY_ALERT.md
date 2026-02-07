# ⚠️ SECURITY ALERT - Token Exposed

## Your GitHub Token Was Exposed

You shared your Personal Access Token publicly. **You must revoke it immediately** and create a new one.

## Step 1: Revoke the Exposed Token (DO THIS NOW)

1. Go to: https://github.com/settings/tokens
2. Find the token that starts with `github_pat_11BJPKC6A0...`
3. Click the **trash icon** or **"Revoke"** button
4. Confirm revocation

## Step 2: Create a New Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `League Comms`
4. Expiration: `90 days` (or your preference)
5. **Check scope**: ✅ `repo`
6. Click **"Generate token"**
7. **COPY THE NEW TOKEN** (starts with `ghp_...`)

## Step 3: Use the New Token Securely

### On Linux (Clone):
```bash
git clone https://github.com/loguefx/League_Comms.git
# When prompted:
# Username: loguefx
# Password: [paste your NEW token - keep it secret!]
```

### On Windows (Push):
```powershell
git push origin main
# When prompted:
# Username: loguefx
# Password: [paste your NEW token - keep it secret!]
```

## Important Security Rules

1. **NEVER share tokens publicly** - Treat them like passwords
2. **NEVER commit tokens to Git** - They're in `.gitignore` for a reason
3. **NEVER paste tokens in chat/email** - Only use them when Git prompts
4. **Revoke old tokens** - If you suspect exposure, revoke immediately
5. **Use SSH keys** - More secure for long-term use (optional)

## After Revoking and Creating New Token

Once you have a new token:

1. **On Linux**: Clone using the new token
2. **On Windows**: Push using the new token
3. **Git will remember it** - You won't need to enter it again

## Optional: Use SSH Instead (More Secure)

If you want to avoid tokens entirely:

### On Linux:
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"
# Press Enter for defaults

# Display public key
cat ~/.ssh/id_ed25519.pub
# Copy the output
```

1. Go to: https://github.com/settings/keys
2. Click "New SSH key"
3. Paste your public key
4. Save

Then clone with SSH:
```bash
git clone git@github.com:loguefx/League_Comms.git
# No password needed!
```
