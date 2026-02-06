# Linux Setup Guide

## Prerequisites

```bash
# Update package manager
sudo apt update  # Debian/Ubuntu
# OR
sudo dnf update  # Fedora
# OR
sudo pacman -Syu  # Arch

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Rust (for Tauri desktop app)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Log out and back in for Docker group to take effect
```

## Quick Setup

```bash
# Clone/navigate to project
cd League_Voice_comm

# Install dependencies
npm install

# Start Docker services
cd infra
docker-compose up -d

# Wait for services to be ready
sleep 5

# Set up database
cd ../apps/api
npm run prisma:generate
npm run prisma:migrate

# Create .env file
cp .env.example .env
# Edit .env with your Riot API credentials

# Start development servers
cd ../..
npm run dev
```

## Verify Everything Works

```bash
# Check Docker containers
docker ps

# Test API
curl http://localhost:4000/health

# Open web app
xdg-open http://localhost:3000
```

## Environment Variables

Edit `apps/api/.env`:

```env
# Database (Docker)
DATABASE_URL="postgresql://league_voice:league_voice_dev@localhost:5432/league_voice?schema=public"

# Redis (Docker)
REDIS_HOST=localhost
REDIS_PORT=6379

# Riot API (get from https://developer.riotgames.com/)
RIOT_CLIENT_ID=your-client-id
RIOT_CLIENT_SECRET=your-client-secret
RIOT_API_KEY=your-api-key
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback

# JWT
JWT_SECRET=change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:1420

# LiveKit (Docker)
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_URL=http://localhost:7880

# Server
PORT=4000
FRONTEND_URL=http://localhost:3000
```

## Troubleshooting

### Docker Permission Denied
```bash
sudo usermod -aG docker $USER
# Log out and back in
```

### Port Already in Use
```bash
# Find what's using the port
sudo lsof -i :4000
sudo lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check logs
docker-compose logs postgres
```

## Production Deployment

For production, you'll need:

1. **Server** (VPS like DigitalOcean, AWS, etc.)
2. **Domain name** (optional, can use IP)
3. **SSL certificate** (Let's Encrypt is free)
4. **Reverse proxy** (Nginx) to serve:
   - Web app (port 3000 → 80/443)
   - API (port 4000 → api.yourdomain.com)
5. **Docker Compose** running on the server
6. **Desktop app builds** hosted for download

## Next Steps After Setup

1. Get Riot API credentials from https://developer.riotgames.com/
2. Add them to `apps/api/.env`
3. Test the OAuth flow at http://localhost:3000/settings
4. Build desktop app: `cd apps/desktop && npm run tauri:build`
