# Project Architecture Overview

## What Docker Does (Backend Services Only)

Docker runs the **backend infrastructure services**:
- **PostgreSQL** - Database (stores users, matches, stats)
- **Redis** - Cache and job queue
- **LiveKit** - Voice communication server

Docker does **NOT** host:
- The website (Next.js app)
- The desktop app (Tauri app)

## Application Structure

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S COMPUTER                      │
│                                                         │
│  ┌──────────────┐         ┌──────────────┐            │
│  │  Web Browser │         │ Desktop App  │            │
│  │  (Next.js)   │         │   (Tauri)    │            │
│  │  Port 3000   │         │              │            │
│  └──────┬───────┘         └──────┬───────┘            │
│         │                        │                     │
│         └────────┬─────────────────┘                   │
│                  │                                     │
└──────────────────┼─────────────────────────────────────┘
                   │
                   │ HTTP/WebSocket
                   │
┌──────────────────┼─────────────────────────────────────┐
│           DOCKER CONTAINERS (Backend)                   │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   NestJS     │  │  PostgreSQL  │  │    Redis    │ │
│  │   API        │  │  (Database)  │  │   (Cache)   │ │
│  │  Port 4000   │  │  Port 5432   │  │  Port 6379  │ │
│  └──────┬───────┘  └──────────────┘  └──────────────┘ │
│         │                                              │
│  ┌──────┴───────┐                                     │
│  │   LiveKit    │                                     │
│  │  (Voice SFU) │                                     │
│  │  Port 7880   │                                     │
│  └──────────────┘                                     │
└───────────────────────────────────────────────────────┘
```

## Development vs Production

### Development (What You're Building Now)
- **Docker**: Runs PostgreSQL, Redis, LiveKit locally
- **Web App**: Runs on your machine (localhost:3000) via `npm run dev`
- **Desktop App**: Runs on your machine via `npm run tauri:dev`
- **API**: Runs on your machine (localhost:4000) via `npm run dev`

### Production (When Users Use It)
- **Docker**: Runs on a server (VPS, cloud, etc.)
- **Web App**: Deployed to Vercel/Netlify or your own server
- **Desktop App**: Built as installer (.exe, .dmg, .AppImage) that users download
- **API**: Deployed to a server (same as Docker or separate)

## Build Order

You can build **both simultaneously** - they're separate clients:

1. **Backend First** (API + Docker services)
   - This is what we've built
   - Handles all the logic, database, voice

2. **Web Client** (Next.js)
   - Browser-based interface
   - Users visit your website
   - Connects to the API

3. **Desktop Client** (Tauri)
   - Native Windows/Mac/Linux app
   - Users download and install
   - Connects to the same API
   - Can have overlay features (future)

## What Users Get

### Web Users
- Visit your website (e.g., `leaguevoice.com`)
- Use it in their browser
- No installation needed

### Desktop Users
- Download installer from your website
- Install on their computer
- Run the app (like Discord desktop app)
- Can have system integration (notifications, etc.)

## Summary

- **Docker** = Backend services (database, cache, voice server)
- **Website** = Separate Next.js app (browser-based)
- **Desktop App** = Separate Tauri app (native install)
- **Both clients** connect to the same backend API
- **Build order**: Backend → Web → Desktop (or all at once)
