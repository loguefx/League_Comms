#!/bin/bash

# League Voice Companion - Linux Setup Script
# Run: chmod +x setup-linux.sh && ./setup-linux.sh

set -e

echo "League Voice Companion - Linux Setup"
echo "====================================="
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js found: $NODE_VERSION"
else
    echo "✗ Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check Docker
echo "Checking Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "✓ Docker found: $DOCKER_VERSION"
else
    echo "✗ Docker not found. Installing..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "⚠ Please log out and back in for Docker group to take effect"
fi

# Check Rust (optional)
echo "Checking Rust..."
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    echo "✓ Rust found: $RUST_VERSION"
else
    echo "⚠ Rust not found. Desktop app won't work. Install from https://rustup.rs/"
fi

# Install dependencies
echo ""
echo "Installing npm dependencies..."
npm install

# Create .env if it doesn't exist
echo ""
echo "Checking environment configuration..."
if [ ! -f "apps/api/.env" ]; then
    echo "Creating .env file with default values..."
    node scripts/create-env.js
else
    echo "✓ .env file exists"
fi

# Start Docker services
echo ""
echo "Starting Docker services..."
cd infra
docker compose up -d
cd ..

# Wait for services
echo ""
echo "Waiting for services to be ready..."
sleep 5

# Generate Prisma client
echo ""
echo "Generating Prisma client..."
cd apps/api
npm run prisma:generate
cd ../..

# Run migrations
echo ""
echo "Running database migrations..."
cd apps/api
npm run prisma:migrate || echo "⚠ Migration may have failed - check Docker is running"
cd ../..

# Build shared packages
echo ""
echo "Building shared packages..."
npm run build || echo "⚠ Build may have failed - this is okay for first run"

echo ""
echo "========================================"
echo "Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit apps/api/.env with your Riot API credentials"
echo "2. Get credentials from https://developer.riotgames.com/"
echo "3. If Docker was just installed, run: newgrp docker"
echo "4. Run 'npm run dev' to start development servers"
echo ""
echo "Web app: http://localhost:3000"
echo "API: http://localhost:4000"
echo ""
echo "To update later:"
echo "  git pull origin main"
echo "  npm install  # If dependencies changed"
echo "  npm run build"
echo "  Or use: ./update-linux.sh"
echo ""
