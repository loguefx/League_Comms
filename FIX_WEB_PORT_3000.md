# Fix Port 3000 Not Browsable

## Problem
The web app on port 3000 is not accessible from other machines or shows connection errors.

## Solution

### Step 1: Make sure the web app is running

```bash
# From project root
cd apps/web
npm run dev
```

You should see:
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Network:     http://192.168.0.159:3000
```

### Step 2: Check if it's binding to the right address

The web app needs to bind to `0.0.0.0` (all interfaces) to be accessible from other machines.

**Updated script:**
```json
"dev": "next dev -H 0.0.0.0 -p 3000"
```

This makes it accessible from:
- `http://localhost:3000` (same machine)
- `http://192.168.0.159:3000` (network IP)

### Step 3: Verify it's running

**Check if process is running:**
```bash
# Windows
netstat -ano | findstr :3000

# Linux
lsof -i :3000
# or
netstat -tulpn | grep :3000
```

**Test in browser:**
- Same machine: `http://localhost:3000`
- Other machine: `http://192.168.0.159:3000`

### Step 4: Check firewall

**Windows:**
1. Windows Defender Firewall
2. Allow app through firewall
3. Add Node.js or port 3000

**Linux:**
```bash
# If using ufw
sudo ufw allow 3000/tcp

# If using firewalld
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

### Step 5: Check for errors

**Common issues:**

1. **Port already in use:**
   ```bash
   # Kill process on port 3000
   # Windows:
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux:
   lsof -ti:3000 | xargs kill
   ```

2. **Build errors:**
   ```bash
   cd apps/web
   npm run build
   # Fix any errors, then:
   npm run dev
   ```

3. **Dependencies not installed:**
   ```bash
   # From project root
   npm install
   ```

## Quick Test

1. **Start web app:**
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Check output:**
   Should show both Local and Network URLs

3. **Test access:**
   - From same machine: `http://localhost:3000`
   - From other machine: `http://192.168.0.159:3000`

## Still Not Working?

1. **Check if Next.js is actually running:**
   - Look for "Ready" message in console
   - Check for error messages

2. **Try different port:**
   ```bash
   PORT=3001 npm run dev
   ```
   Then access: `http://192.168.0.159:3001`

3. **Check network connectivity:**
   ```bash
   # From other machine, test if port is open
   telnet 192.168.0.159 3000
   # or
   curl http://192.168.0.159:3000
   ```

4. **Check Next.js logs:**
   - Look for compilation errors
   - Look for "Ready" message
   - Check for port binding errors
