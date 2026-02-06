# How to Transfer Project from Windows to Linux

## Method 1: Using Git (Recommended)

### On Windows:
```powershell
# If not already a git repo, initialize it
cd D:\League_Voice_comm
git init
git add .
git commit -m "Initial commit"

# Push to GitHub/GitLab/Bitbucket
git remote add origin <your-repo-url>
git push -u origin main
```

### On Linux:
```bash
git clone <your-repo-url>
cd League_Voice_comm
./setup-linux.sh
```

## Method 2: Using SCP (SSH)

### On Windows (PowerShell):
```powershell
# Install OpenSSH if needed
# Then copy:
scp -r D:\League_Voice_comm user@linux-ip:/home/user/
```

### On Linux:
```bash
cd ~/League_Voice_comm
./setup-linux.sh
```

## Method 3: Using USB Drive

1. **On Windows:**
   - Copy `D:\League_Voice_comm` folder to USB drive

2. **On Linux:**
   ```bash
   # Mount USB (usually auto-mounted)
   # Copy folder
   cp -r /media/user/USB/League_Voice_comm ~/
   cd ~/League_Voice_comm
   ./setup-linux.sh
   ```

## Method 4: Using Network Share

### On Windows:
1. Right-click `League_Voice_comm` folder
2. Properties → Sharing → Share
3. Note the network path

### On Linux:
```bash
# Mount Windows share
sudo mkdir /mnt/windows-share
sudo mount -t cifs //windows-ip/League_Voice_comm /mnt/windows-share -o username=your-windows-user

# Copy files
cp -r /mnt/windows-share ~/League_Voice_comm
cd ~/League_Voice_comm
./setup-linux.sh
```

## Method 5: Using Cloud Storage

1. **On Windows:**
   - Upload `League_Voice_comm` folder to Google Drive/Dropbox/OneDrive
   - Or zip it: `Compress-Archive -Path D:\League_Voice_comm -DestinationPath league-voice.zip`

2. **On Linux:**
   - Download from cloud storage
   - Extract if zipped: `unzip league-voice.zip`
   - Run setup script

## Quick Checklist

Before running setup script, make sure you have:

- [ ] Project folder on Linux machine
- [ ] `setup-linux.sh` file exists
- [ ] `package.json` file exists
- [ ] `infra/docker-compose.yml` exists
- [ ] `apps/api/.env.example` exists

Then run:
```bash
chmod +x setup-linux.sh
./setup-linux.sh
```
