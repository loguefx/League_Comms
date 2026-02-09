# Start API Server on Ubuntu

## Problem
The API server is not running on Ubuntu. `curl http://localhost:4000/health` fails with "Could not connect to server".

## Solution: Start the API Server

### Step 1: Check if API Process is Running

```bash
# Check for node processes
ps aux | grep node

# Or check what's using port 4000 (if ss is available)
sudo ss -tlnp | grep 4000
```

### Step 2: Navigate to API Directory

```bash
cd ~/League_Comms/apps/api
# or wherever your project is located
cd ~/League_Voice_comm/apps/api
```

### Step 3: Start the API Server

```bash
npm run dev
```

### Step 4: Verify It Started

You should see output like:
```
🚀 API server running on http://localhost:4000
📡 Health check: http://localhost:4000/health
```

### Step 5: Test from Ubuntu

In a new terminal (keep the API running), test:

```bash
curl http://localhost:4000/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Step 6: Test from Windows

Once it's working on Ubuntu, test from Windows:

```powershell
Invoke-WebRequest http://192.168.0.159:4000/health
```

## If API Fails to Start

### Check for Errors:
- Database connection issues?
- Missing `.env` file?
- Port 4000 already in use?

### Common Fixes:

```bash
# Make sure you're in the right directory
cd ~/League_Comms/apps/api

# Check if .env exists
ls -la .env

# Check database connection
# Make sure PostgreSQL is running
docker ps
# or
sudo systemctl status postgresql

# If port is in use, find and kill it
sudo lsof -ti:4000 | xargs kill
# or
sudo fuser -k 4000/tcp
```
