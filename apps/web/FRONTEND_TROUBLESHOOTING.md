# Frontend Troubleshooting - Port 3000 Not Accessible

## Quick Checks

### 1. Is the server running?

Check if the Next.js dev server is actually running:

```bash
# Check if port 3000 is in use
netstat -tuln | grep 3000
# Or on Linux/Mac:
lsof -i :3000
```

### 2. Check for errors in the terminal

Look for any error messages when running `npm run dev` in the `apps/web` directory.

### 3. Try accessing from different URLs

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://YOUR_IP_ADDRESS:3000` (if on a network)

## Common Issues and Fixes

### Issue 1: Port Already in Use

**Error:** `Port 3000 is already in use`

**Fix:**
```bash
# Kill the process using port 3000
# On Linux/Mac:
lsof -ti:3000 | xargs kill -9

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Or change the port:
```bash
cd apps/web
npm run dev -- -p 3001
```

### Issue 2: Firewall Blocking

**Symptom:** Server starts but can't access from browser

**Fix:**
- Check firewall settings
- On Ubuntu: `sudo ufw allow 3000`
- On Windows: Add port 3000 to firewall exceptions

### Issue 3: Server Not Binding to 0.0.0.0

**Symptom:** Works on localhost but not from network IP

**Fix:** The config already has `-H 0.0.0.0` which should work. If not, verify:
```bash
cd apps/web
npm run dev
```

You should see: `- Local: http://localhost:3000` and `- Network: http://YOUR_IP:3000`

### Issue 4: Next.js Build Errors

**Symptom:** Server won't start due to compilation errors

**Fix:**
```bash
cd apps/web
rm -rf .next
npm run dev
```

### Issue 5: Running from Wrong Directory

**Symptom:** Command not found or wrong behavior

**Fix:** Make sure you're in the right directory:
```bash
# From project root
cd apps/web
npm run dev
```

Or from root:
```bash
npm run dev
# This runs turbo which should start both API and web
```

## Manual Start (If Turbo Isn't Working)

If `npm run dev` from root isn't working, start manually:

```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Web
cd apps/web
npm run dev
```

## Verify Configuration

Check that `apps/web/package.json` has:
```json
"dev": "next dev -H 0.0.0.0 -p 3000"
```

The `-H 0.0.0.0` flag makes it accessible from network IPs, not just localhost.

## Still Not Working?

1. Check the terminal output for specific error messages
2. Verify Node.js version: `node --version` (should be >= 18.0.0)
3. Try a clean install:
   ```bash
   cd apps/web
   rm -rf node_modules .next
   npm install
   npm run dev
   ```
