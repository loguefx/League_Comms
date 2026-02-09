# Diagnose API Connection Issue

## Problem
- ✅ Port 3000 (web app) is accessible from Windows → Ubuntu
- ❌ Port 4000 (API) is NOT accessible from Windows → Ubuntu
- ✅ Firewall is off
- ✅ API server appears to be running in Ubuntu terminal

## Diagnosis Steps

### Step 1: Verify API is Actually Listening on Port 4000

**On Ubuntu terminal, run:**

```bash
# Check if port 4000 is in use
sudo netstat -tlnp | grep 4000
# or
sudo ss -tlnp | grep 4000
```

**Expected output:**
```
tcp  0  0  0.0.0.0:4000  0.0.0.0:*  LISTEN  <pid>/node
```

**If you see `127.0.0.1:4000` instead of `0.0.0.0:4000`:**
- The server is only listening on localhost
- It won't accept external connections
- This is the problem!

**If you see nothing:**
- The API server is not running on port 4000
- Check the terminal where you ran `npm run dev` for errors

### Step 2: Test API from Ubuntu Itself

**On Ubuntu terminal, test if the API responds:**

```bash
# Test health endpoint
curl http://localhost:4000/health

# Test patches endpoint
curl http://localhost:4000/champions/patches

# Test champions endpoint
curl "http://localhost:4000/champions?rank=ALL_RANKS&patch=latest&region=world"
```

**If these work:**
- API is running correctly on Ubuntu
- The issue is network connectivity from Windows

**If these fail:**
- API server has crashed or isn't running
- Check the terminal output for errors

### Step 3: Check VirtualBox Network Configuration

Since you're using VirtualBox:
1. **Check network adapter type:**
   - VirtualBox → Settings → Network
   - Adapter should be "NAT" or "Bridged Adapter"
   - If "NAT", port forwarding might be needed

2. **If using NAT, add port forwarding:**
   - VirtualBox → Settings → Network → Advanced → Port Forwarding
   - Add rule:
     - Name: `api`
     - Protocol: `TCP`
     - Host IP: (leave empty)
     - Host Port: `4000`
     - Guest IP: (leave empty)
     - Guest Port: `4000`

### Step 4: Test from Windows with Different Methods

**Try these from Windows PowerShell:**

```powershell
# Method 1: Test with curl (if available)
curl http://192.168.0.159:4000/health

# Method 2: Test with Invoke-WebRequest
Invoke-WebRequest http://192.168.0.159:4000/health

# Method 3: Test with telnet (if available)
telnet 192.168.0.159 4000
```

### Step 5: Check API Server Logs

**Look at the Ubuntu terminal where the API is running:**
- Are there any error messages?
- Does it say "🚀 API server running on http://localhost:4000"?
- Are there any connection errors or crashes?

## Quick Fix: Run API on Windows Instead

If the network issue persists, you can run the API on Windows:

1. **Stop API on Ubuntu** (Ctrl+C)

2. **On Windows, start API:**
   ```powershell
   cd apps\api
   npm run dev
   ```

3. **Frontend will automatically use `localhost:4000`** (since it detects hostname)

This way both servers run on Windows and there's no network issue.
