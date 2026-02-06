# Linux Setup Script - How It Works

## What You Need BEFORE Running the Script

### Option 1: Copy Project from Windows to Linux

1. **On your Windows machine:**
   - The project is already at `D:\League_Voice_comm`
   - Copy this entire folder to your Linux machine

2. **Transfer methods:**
   ```bash
   # Method 1: Using SCP (if you have SSH access)
   scp -r D:\League_Voice_comm user@linux-machine:/home/user/
   
   # Method 2: Using USB drive
   # Copy folder to USB, then copy from USB to Linux
   
   # Method 3: Using network share
   # Share the folder on Windows, mount on Linux
   
   # Method 4: Using Git (if you have a repo)
   git clone <your-repo-url>
   ```

3. **On your Linux machine:**
   ```bash
   cd ~/League_Voice_comm
   chmod +x setup-linux.sh
   ./setup-linux.sh
   ```

### Option 2: Clone from Git Repository

If you've pushed the project to GitHub/GitLab:

```bash
git clone <your-repository-url>
cd League_Voice_comm
chmod +x setup-linux.sh
./setup-linux.sh
```

## What the Script Does

The `setup-linux.sh` script:

### 1. Checks Prerequisites
- ✅ Checks if Node.js is installed (installs if missing)
- ✅ Checks if Docker is installed (installs if missing)
- ✅ Checks if Rust is installed (warns if missing, optional)

### 2. Installs Docker (if needed)
- Downloads Docker installation script
- Installs Docker automatically
- Adds your user to docker group
- **Note:** You'll need to log out/in for Docker group to work

### 3. Sets Up Project
- Installs npm dependencies (`npm install`)
- Creates `.env` file from `.env.example`
- Starts Docker containers (PostgreSQL, Redis, LiveKit)
- Generates Prisma client
- Runs database migrations
- Builds shared packages

### 4. What It DOESN'T Do
- ❌ Doesn't clone the repository (you need the files first)
- ❌ Doesn't configure Riot API credentials (you edit `.env` manually)
- ❌ Doesn't install system packages like `git`, `curl` (assumes they exist)

## Step-by-Step Workflow

### On Windows (Before Moving to Linux)

1. Make sure your project is complete
2. Copy the entire `League_Voice_comm` folder to Linux

### On Linux

1. **Get the project files:**
   ```bash
   # If copied via USB/network
   cd ~/League_Voice_comm
   
   # OR if using Git
   git clone <your-repo>
   cd League_Voice_comm
   ```

2. **Make script executable:**
   ```bash
   chmod +x setup-linux.sh
   ```

3. **Run the script:**
   ```bash
   ./setup-linux.sh
   ```

4. **After script completes:**
   ```bash
   # Edit .env with your Riot API credentials
   nano apps/api/.env
   
   # Start development
   npm run dev
   ```

## What Gets Installed Automatically

### Docker Installation
The script runs:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

This installs:
- Docker Engine
- Docker Compose (usually included)
- Adds you to docker group

**Important:** After Docker installation, you need to:
```bash
# Log out and back in, OR run:
newgrp docker
```

### Docker Containers Started
The script automatically runs:
```bash
cd infra
docker compose up -d
```

This starts:
- PostgreSQL (database)
- Redis (cache)
- LiveKit (voice server)

## Manual Steps You Still Need

1. **Get Riot API credentials:**
   - Go to https://developer.riotgames.com/
   - Create an application
   - Get Client ID, Client Secret, and API Key

2. **Edit `.env` file:**
   ```bash
   nano apps/api/.env
   # Add your Riot credentials
   ```

3. **Verify Docker group (if just installed):**
   ```bash
   newgrp docker
   docker ps  # Should work without sudo
   ```

## Complete Example Workflow

```bash
# 1. Get project files (choose one method)
# Option A: Copy from Windows
scp -r user@windows:/path/to/League_Voice_comm ~/

# Option B: Clone from Git
git clone https://github.com/yourusername/league-voice.git
cd league-voice

# 2. Run setup script
chmod +x setup-linux.sh
./setup-linux.sh

# 3. If Docker was just installed, activate docker group
newgrp docker

# 4. Verify Docker is working
docker ps

# 5. Edit environment file
nano apps/api/.env
# Add your Riot API credentials

# 6. Start development
npm run dev
```

## Troubleshooting

### "Permission denied" when running script
```bash
chmod +x setup-linux.sh
```

### "Docker: permission denied" after installation
```bash
newgrp docker
# OR log out and back in
```

### Script fails at Docker step
```bash
# Check if Docker installed correctly
sudo docker ps

# If that works, add yourself to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Script can't find project files
Make sure you're in the project directory:
```bash
pwd  # Should show .../League_Voice_comm
ls   # Should show setup-linux.sh, package.json, etc.
```

## Summary

**You need:**
- ✅ Project files (copy from Windows or clone from Git)
- ✅ Basic Linux tools (curl, git - usually pre-installed)

**Script does:**
- ✅ Installs Node.js (if missing)
- ✅ Installs Docker (if missing)
- ✅ Sets up project dependencies
- ✅ Starts Docker containers
- ✅ Sets up database

**You still need to:**
- ⚠️ Add Riot API credentials to `.env`
- ⚠️ Log out/in after Docker installation (or run `newgrp docker`)
