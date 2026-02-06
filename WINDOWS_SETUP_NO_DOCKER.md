# Windows Setup Without Docker

If you prefer not to use Docker, you can install the services directly on Windows. However, this is more complex.

## Option 1: Use Docker (Recommended - Much Easier!)

Docker Desktop for Windows is specifically designed for Windows and makes running these services trivial. It's the same Docker used on Linux/Mac - just with a Windows installer.

**Why Docker is better:**
- One-click install of all services
- No configuration conflicts
- Easy to start/stop/remove
- Works exactly like on other platforms

**Install Docker Desktop:** https://www.docker.com/products/docker-desktop/

## Option 2: Install Services Natively (Advanced)

### 1. Install PostgreSQL
1. Download from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set (default user: postgres)
4. Update `apps/api/.env`:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/league_voice?schema=public"
   ```

### 2. Install Redis
1. Download from https://github.com/microsoftarchive/redis/releases
2. Or use WSL2: `wsl --install` then `sudo apt-get install redis`
3. Update `apps/api/.env`:
   ```
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

### 3. Install LiveKit (Most Complex)
LiveKit doesn't have a simple Windows installer. Options:
- Use Docker (easiest)
- Use WSL2
- Run in a Linux VM
- Use a cloud LiveKit instance

## Recommendation

**Just install Docker Desktop!** It's:
- Free
- Designed for Windows
- Takes 5 minutes to install
- Makes everything work automatically

The script needs Docker because that's the standard way to run these services in development, regardless of your operating system.
