# Fix API Connection Issue (Windows to Ubuntu)

## Problem
Cannot connect to API server at `192.168.0.159:4000` from Windows machine.

## Solution 1: Check Ubuntu Firewall

The API server is running on Ubuntu, but the firewall might be blocking port 4000.

### On Ubuntu terminal, run:

```bash
# Check if firewall is active
sudo ufw status

# If firewall is active, allow port 4000
sudo ufw allow 4000/tcp

# Verify the rule was added
sudo ufw status
```

## Solution 2: Test from Ubuntu Terminal

Since the API is running on Ubuntu, test it directly from there:

```bash
# Test health endpoint
curl http://localhost:4000/health

# Test champions endpoint
curl http://localhost:4000/champions/patches

# Trigger aggregation
curl -X POST http://localhost:4000/champions/aggregate
```

## Solution 3: Verify Server is Listening on All Interfaces

The server should already be listening on `0.0.0.0` (all interfaces), but verify:

```bash
# Check what's listening on port 4000
sudo netstat -tlnp | grep 4000
# or
sudo ss -tlnp | grep 4000
```

You should see something like:
```
0.0.0.0:4000    LISTEN    <pid>/node
```

If you see `127.0.0.1:4000` instead, the server is only listening on localhost.

## Solution 4: Test Network Connectivity

From Windows, test if you can reach the Ubuntu machine:

```powershell
# Test ping
ping 192.168.0.159

# Test port connectivity (if you have telnet)
telnet 192.168.0.159 4000
```

## Solution 5: Use Ubuntu Terminal for API Commands

Since you're running the server on Ubuntu, use the Ubuntu terminal for API commands:

```bash
# Trigger aggregation
curl -X POST http://localhost:4000/champions/aggregate

# Check diagnostics
curl http://localhost:4000/champions/diagnostics

# Check patches
curl http://localhost:4000/champions/patches
```

## What Changed

✅ **Aggregation now runs every 2 minutes** (instead of 10)
✅ **Match pulling now runs every 2 minutes** (instead of 10)
✅ **Aggregation automatically runs after match pulling completes**

This means:
- Every 2 minutes: Pull matches from all regions
- After match pulling: Automatically aggregate champion stats
- Every 2 minutes: Also run aggregation independently (as a backup)

This ensures your champion stats stay up-to-date even with high-volume data ingestion!
