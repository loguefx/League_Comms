# Push to GitHub - Ready to Go!

Your repository is set up and ready to push: https://github.com/loguefx/League_Comms.git

## Push Now (Windows PowerShell)

Run these commands:

```powershell
cd D:\League_Voice_comm

# Check status
git status

# Push to GitHub
git push -u origin main
```

If you get authentication errors, you may need to:

1. **Use Personal Access Token:**
   - Go to https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scopes: `repo`
   - Copy token
   - When prompted for password, paste the token

2. **Or use SSH:**
   ```powershell
   git remote set-url origin git@github.com:loguefx/League_Comms.git
   git push -u origin main
   ```

## After Pushing

### On Linux Machine:

```bash
# Clone your repository
git clone https://github.com/loguefx/League_Comms.git
cd League_Comms

# Run setup
chmod +x setup-linux.sh
./setup-linux.sh

# Configure .env
nano apps/api/.env

# Start development
npm run dev
```

## Updating Later

### On Windows (After Changes):
```powershell
git add .
git commit -m "Your change description"
git push origin main
```

### On Linux (Get Updates):
```bash
cd ~/League_Comms
git pull origin main
npm install  # If dependencies changed
npm run build
npm run dev
```

Or use the update script:
```bash
./update-linux.sh
```

## Removing Docker for Updates

### Stop Containers (Keeps Database):
```bash
cd infra
docker compose down
```

### Remove Containers + Database:
```bash
cd infra
docker compose down -v  # Deletes database!
```

### Fresh Install:
```bash
cd infra
docker compose down -v
cd ..
rm -rf League_Comms
git clone https://github.com/loguefx/League_Comms.git
cd League_Comms
./setup-linux.sh
```
