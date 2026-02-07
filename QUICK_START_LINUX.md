# Quick Start - Linux

## Clone and Setup in 5 Commands

```bash
# 1. Clone repository
git clone https://github.com/loguefx/League_Comms.git
cd League_Comms

# 2. Make setup script executable
chmod +x setup-linux.sh

# 3. Run setup (installs Docker, Node.js, sets up everything)
./setup-linux.sh

# 4. If Docker was just installed, activate docker group
newgrp docker

# 5. Edit .env with your Riot API credentials
nano apps/api/.env
```

## After Setup

```bash
# Start development servers
npm run dev
```

Then open http://localhost:3000 in your browser.

## Get Riot API Credentials

1. Go to https://developer.riotgames.com/
2. Create an application
3. Get Client ID, Client Secret, and API Key
4. Add them to `apps/api/.env`

## That's It!

Your app should be running at:
- Web: http://localhost:3000
- API: http://localhost:4000
