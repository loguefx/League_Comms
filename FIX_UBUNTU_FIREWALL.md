# Fix Ubuntu Firewall to Allow API Access

## Problem
The API server is running on Ubuntu VM (192.168.0.159:4000), but Windows host cannot connect.
Network test shows: `PingSucceeded: True` but `TcpTestSucceeded: False`

This means the Ubuntu firewall (ufw) is blocking port 4000.

## Solution: Allow Port 4000 on Ubuntu

**On your Ubuntu VM terminal, run:**

```bash
# Check firewall status
sudo ufw status

# Allow port 4000 for API server
sudo ufw allow 4000/tcp

# Verify the rule was added
sudo ufw status
```

You should see output like:
```
Status: active

To                         Action      From
--                         ------      ----
4000/tcp                   ALLOW       Anywhere
4000/tcp (v6)              ALLOW       Anywhere (v6)
```

## Test Connection from Windows

After allowing the port, test from Windows PowerShell:

```powershell
# Test health endpoint
Invoke-WebRequest http://192.168.0.159:4000/health

# Test patches endpoint
Invoke-WebRequest http://192.168.0.159:4000/champions/patches
```

## Verify Server is Listening on All Interfaces

The API server should already be listening on `0.0.0.0` (all network interfaces), but verify:

```bash
# On Ubuntu, check what's listening on port 4000
sudo netstat -tlnp | grep 4000
# or
sudo ss -tlnp | grep 4000
```

You should see:
```
0.0.0.0:4000    LISTEN    <pid>/node
```

If you see `127.0.0.1:4000` instead, the server is only listening on localhost and won't accept external connections.

## After Fixing Firewall

Once port 4000 is allowed:
1. ✅ Windows can connect to `http://192.168.0.159:4000`
2. ✅ Frontend can fetch champion data
3. ✅ Patches endpoint will work
4. ✅ Champions will display on the website

## Alternative: If You Want to Run API on Windows Too

If you want to run the API on Windows (localhost:4000) instead of Ubuntu:

1. **Stop the API on Ubuntu** (Ctrl+C in the Ubuntu terminal)

2. **On Windows, start the API:**
   ```powershell
   cd apps\api
   npm run dev
   ```

3. **The frontend will automatically use `localhost:4000`** (since it detects the hostname)

This way both servers run on Windows and there's no firewall issue.
