# Clone and Setup on Linux - Step by Step

## Step 1: Clone the Repository

Open a terminal on your Linux machine and run:

```bash
# Clone your repository
git clone https://github.com/loguefx/League_Comms.git

# Navigate into the project
cd League_Comms
```

## Step 2: Make Setup Script Executable

```bash
# Make the setup script executable
chmod +x setup-linux.sh
```

## Step 3: Run the Setup Script

```bash
# Run the setup script
./setup-linux.sh
```

The script will:
- ✅ Check and install Node.js (if needed)
- ✅ Check and install Docker (if needed)
- ✅ Install all npm dependencies
- ✅ Create `.env` file from `.env.example`
- ✅ Start Docker containers (PostgreSQL, Redis, LiveKit)
- ✅ Set up the database
- ✅ Build shared packages

## Step 4: Configure Environment Variables

After the script completes, edit the `.env` file:

```bash
# Edit the environment file
nano apps/api/.env
```

Add your Riot API credentials:
- `RIOT_CLIENT_ID` - From https://developer.riotgames.com/
- `RIOT_CLIENT_SECRET` - From https://developer.riotgames.com/
- `RIOT_API_KEY` - From https://developer.riotgames.com/
- `RIOT_REDIRECT_URI` - Should be `http://localhost:4000/auth/riot/callback`

Save and exit (Ctrl+X, then Y, then Enter in nano).

## Step 5: Activate Docker Group (If Docker Was Just Installed)

If the script installed Docker, you need to activate the docker group:

```bash
# Activate docker group (or log out and back in)
newgrp docker

# Verify Docker works without sudo
docker ps
```

## Step 6: Start Development Servers

```bash
# From the project root
npm run dev
```

This starts:
- API server: http://localhost:4000
- Web app: http://localhost:3000

## Complete Command Sequence

Here's everything in one go:

```bash
# 1. Clone repository
git clone https://github.com/loguefx/League_Comms.git
cd League_Comms

# 2. Make script executable
chmod +x setup-linux.sh

# 3. Run setup
./setup-linux.sh

# 4. If Docker was just installed, activate docker group
newgrp docker

# 5. Edit environment file
nano apps/api/.env
# Add your Riot API credentials, save and exit

# 6. Start development
npm run dev
```

## Verify Everything is Running

### Check Docker Containers
```bash
docker ps
```

You should see:
- `league-voice-postgres`
- `league-voice-redis`
- `league-voice-livekit`

### Check API Health
```bash
curl http://localhost:4000/health
```

Should return: `{"status":"ok",...}`

### Open Web App
```bash
# Open in browser
xdg-open http://localhost:3000
# or
firefox http://localhost:3000
# or
google-chrome http://localhost:3000
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
# Check if Docker is running
sudo systemctl status docker

# Start Docker if needed
sudo systemctl start docker
sudo systemctl enable docker

# Add yourself to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Port already in use
```bash
# Find what's using the port
sudo lsof -i :4000
sudo lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database connection failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
cd infra
docker compose logs postgres
```

## Next Steps After Setup

1. **Get Riot API credentials** from https://developer.riotgames.com/
2. **Add them to** `apps/api/.env`
3. **Test the app**:
   - Open http://localhost:3000
   - Go to Settings
   - Connect Riot Account
   - Test live game detection

## Quick Reference

- **Repository**: https://github.com/loguefx/League_Comms.git
- **Setup script**: `./setup-linux.sh`
- **Update script**: `./update-linux.sh`
- **Docker containers**: `cd infra && docker compose up -d`
- **Stop Docker**: `cd infra && docker compose down`
