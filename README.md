# League Voice Companion

A League of Legends companion application similar to OP.GG/U.GG with live game detection, teammate stats, and automatic voice room joining.

## Features

- 🔐 **Riot Sign On (RSO) OAuth** - Secure authentication with Riot Games
- 🎮 **Live Game Detection** - Automatically detects when you're in a match
- 📊 **Match History** - View detailed stats from past games
- 📈 **Champion Analytics** - Win rates filtered by rank, role, and patch
- 🎤 **Voice Rooms** - Auto-join voice channels with teammates
- 💻 **Cross-Platform** - Web app and Desktop app (Tauri)

## Tech Stack

- **Backend**: NestJS (Fastify adapter), PostgreSQL, Redis, Prisma
- **Frontend**: Next.js (Web), Tauri (Desktop)
- **Voice**: LiveKit (self-hosted SFU)
- **Monorepo**: Turborepo
- **Language**: TypeScript

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/loguefx/League_Comms.git
   cd League_Comms
   ```

2. **Run setup script (Linux):**
   ```bash
   chmod +x setup-linux.sh
   ./setup-linux.sh
   ```

3. **Configure environment:**
   ```bash
   # Edit apps/api/.env with your Riot API credentials
   nano apps/api/.env
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```

### Getting Riot API Credentials

1. Go to https://developer.riotgames.com/
2. Create an application
3. Get your Client ID, Client Secret, and API Key
4. Add them to `apps/api/.env`

## Project Structure

```
League_Comms/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js web app
│   └── desktop/      # Tauri desktop app
├── packages/
│   ├── shared/       # Shared types and utilities
│   ├── riot/         # Riot API client wrappers
│   └── ui/           # Shared UI components
└── infra/            # Docker Compose configuration
```

## Development

### Start All Services

```bash
npm run dev
```

This starts:
- API server: http://localhost:4000
- Web app: http://localhost:3000
- Desktop app: (Tauri dev mode)

### Start Docker Services

```bash
cd infra
docker compose up -d
```

Services:
- PostgreSQL (port 5432)
- Redis (port 6379)
- LiveKit (port 7880)

## Updating

### Quick Update

```bash
git pull origin main
npm install  # If dependencies changed
npm run build
npm run dev
```

### Using Update Script

```bash
chmod +x update-linux.sh
./update-linux.sh
# Choose update type (1=Quick, 2=Full, 3=Fresh)
```

## Docker Management

### Stop Containers (Keeps Database)
```bash
cd infra
docker compose down
```

### Remove Everything (Deletes Database!)
```bash
cd infra
docker compose down -v
```

## Documentation

- [Linux Setup Guide](LINUX_SETUP_COMPLETE.md)
- [GitHub Workflow](GITHUB_WORKFLOW.md)
- [Quick Update Guide](QUICK_UPDATE.md)
- [Push to GitHub](PUSH_TO_GITHUB.md)

## License

[Your License Here]

## Contributing

[Contributing Guidelines]
