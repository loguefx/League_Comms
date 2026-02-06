# Using Server IP Instead of Localhost

## When to Use Server IP

If you're running the app on a **Linux server** and accessing it from:
- Another computer on your network
- The internet (if your server is publicly accessible)
- Your Windows machine (while the server runs on Linux)

Then **YES**, use your server's IP address!

## How to Find Your Server IP

### On Linux Server

```bash
# Method 1: Using hostname
hostname -I

# Method 2: Using ip command
ip addr show

# Method 3: Using ifconfig (if installed)
ifconfig

# Method 4: Check your network interface
ip route get 8.8.8.8 | awk '{print $7}'
```

Look for an IP address like:
- `192.168.1.100` (local network)
- `10.0.0.50` (local network)
- Or your public IP if accessible from internet

## What to Put in Riot Developer Portal

### Product URL

If your server IP is `192.168.1.100`:

```
http://192.168.1.100:3000
```

Or if you have a domain name:
```
http://yourdomain.com:3000
```

### Redirect URI (More Important!)

This is where Riot sends users after OAuth login. It should point to your **API server**:

```
http://192.168.1.100:4000/auth/riot/callback
```

**Important**: This must match exactly what's in your `.env` file!

## Update Your .env File

After getting your server IP, update `apps/api/.env`:

```env
# Use your server IP instead of localhost
RIOT_REDIRECT_URI=http://192.168.1.100:4000/auth/riot/callback

# CORS - Allow your server IP
ALLOWED_ORIGINS=http://192.168.1.100:3000,http://localhost:3000,http://localhost:1420

# Frontend URL
FRONTEND_URL=http://192.168.1.100:3000
```

## Network Access Considerations

### Local Network Access

If your server is on your local network:
- Use the local IP (e.g., `192.168.1.100`)
- Make sure port 3000 and 4000 are open in your firewall
- Other devices on the same network can access it

### Public Internet Access

If you want to access from anywhere:
- Use your public IP or domain name
- Set up port forwarding on your router (if behind NAT)
- Consider using a service like ngrok for testing
- For production, use a proper domain name with HTTPS

## Firewall Configuration

Make sure ports are open:

```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp
sudo ufw allow 4000/tcp

# Or if using firewalld (CentOS/RHEL)
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --add-port=4000/tcp --permanent
sudo firewall-cmd --reload
```

## Testing

After configuring:

1. **Test web app access:**
   ```bash
   # From another machine, open browser:
   http://192.168.1.100:3000
   ```

2. **Test API access:**
   ```bash
   curl http://192.168.1.100:4000/health
   ```

3. **Test OAuth redirect:**
   - Visit: `http://192.168.1.100:4000/auth/riot/start`
   - Should redirect to Riot login
   - After login, should redirect back to your callback URL

## Quick Decision Guide

| Scenario | Product URL | Redirect URI |
|----------|-------------|--------------|
| **Running on same machine you're using** | `http://localhost:3000` | `http://localhost:4000/auth/riot/callback` |
| **Server on local network, accessing from another PC** | `http://192.168.1.100:3000` | `http://192.168.1.100:4000/auth/riot/callback` |
| **Public server with domain** | `https://yourdomain.com` | `https://yourdomain.com/auth/riot/callback` |
| **Testing with ngrok** | `https://abc123.ngrok.io` | `https://abc123.ngrok.io/auth/riot/callback` |

## Important Notes

1. **Redirect URI must match exactly** in:
   - Riot Developer Portal
   - Your `.env` file
   - Your API code

2. **CORS settings** must allow your frontend URL

3. **HTTPS required for production** - Riot OAuth requires HTTPS for production apps

4. **You can update these later** - If your IP changes or you get a domain, you can update them in the Riot Developer Portal

## Example Configuration

If your Linux server IP is `192.168.1.100`:

**Riot Developer Portal:**
- Product URL: `http://192.168.1.100:3000`
- Redirect URI: `http://192.168.1.100:4000/auth/riot/callback`

**Your .env file:**
```env
RIOT_REDIRECT_URI=http://192.168.1.100:4000/auth/riot/callback
ALLOWED_ORIGINS=http://192.168.1.100:3000,http://localhost:3000,http://localhost:1420
FRONTEND_URL=http://192.168.1.100:3000
```

## Summary

✅ **Yes, use your server IP** if accessing from another machine  
✅ **Find IP with**: `hostname -I` or `ip addr show`  
✅ **Update both**: Product URL and Redirect URI  
✅ **Update .env file** to match  
✅ **Open firewall ports** 3000 and 4000  
