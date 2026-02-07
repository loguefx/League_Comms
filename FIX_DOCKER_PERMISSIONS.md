# Fix Docker Permission Denied Error

## Problem
```
permission denied while trying to connect to the Docker daemon socket
```

This means your user doesn't have permission to access Docker.

## Quick Fix

### Option 1: Activate Docker Group (Recommended)

```bash
# Activate docker group (if you were just added)
newgrp docker

# Verify it works
docker ps

# Now try setup again
./setup-linux.sh
```

### Option 2: Add User to Docker Group

```bash
# Add yourself to docker group
sudo usermod -aG docker $USER

# Activate the group
newgrp docker

# Or log out and back in
# Then verify
docker ps
```

### Option 3: Use Sudo (Temporary, Not Recommended)

```bash
# Run Docker commands with sudo
sudo docker compose up -d

# But this is not ideal - better to fix permissions
```

## Complete Fix Steps

```bash
# 1. Add yourself to docker group
sudo usermod -aG docker $USER

# 2. Activate docker group
newgrp docker

# 3. Verify Docker works
docker ps

# 4. Continue setup
./setup-linux.sh
```

## If Still Having Issues

```bash
# Check if Docker is running
sudo systemctl status docker

# Start Docker if needed
sudo systemctl start docker
sudo systemctl enable docker  # Start on boot

# Add user to group
sudo usermod -aG docker $USER

# Log out and back in (or use newgrp)
newgrp docker

# Test
docker ps
```

## After Fixing Permissions

Once Docker permissions are fixed, the setup script should work. You may also need to create the `.env` file manually (see next guide).
