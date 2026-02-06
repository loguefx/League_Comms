#!/bin/bash

# League Voice Companion - Update Script
# Run: chmod +x update-linux.sh && ./update-linux.sh

set -e

echo "League Voice Companion - Update"
echo "================================"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "✗ Not a git repository. Cannot update."
    exit 1
fi

# Ask user what type of update
echo "What type of update?"
echo "1) Quick update (pull changes, restart)"
echo "2) Full update (rebuild everything)"
echo "3) Fresh install (remove containers, reinstall)"
read -p "Choose (1-3): " update_type

case $update_type in
    1)
        echo ""
        echo "Quick update..."
        
        # Stop containers
        echo "Stopping containers..."
        cd infra
        docker compose down
        cd ..
        
        # Pull latest
        echo "Pulling latest changes..."
        git pull origin main
        
        # Restart containers
        echo "Restarting containers..."
        cd infra
        docker compose up -d
        cd ..
        
        echo "✓ Quick update complete!"
        ;;
        
    2)
        echo ""
        echo "Full update..."
        
        # Stop containers
        echo "Stopping containers..."
        cd infra
        docker compose down
        cd ..
        
        # Pull latest
        echo "Pulling latest changes..."
        git pull origin main
        
        # Update dependencies
        echo "Updating dependencies..."
        npm install
        
        # Rebuild
        echo "Rebuilding packages..."
        npm run build
        
        # Run migrations
        echo "Running database migrations..."
        cd apps/api
        npm run prisma:migrate || echo "⚠ Migration may have failed"
        cd ../..
        
        # Restart containers
        echo "Restarting containers..."
        cd infra
        docker compose up -d
        cd ..
        
        echo "✓ Full update complete!"
        ;;
        
    3)
        echo ""
        echo "⚠ WARNING: This will delete your database!"
        read -p "Are you sure? (yes/no): " confirm
        
        if [ "$confirm" != "yes" ]; then
            echo "Update cancelled."
            exit 0
        fi
        
        # Stop and remove containers + volumes
        echo "Removing containers and volumes..."
        cd infra
        docker compose down -v
        cd ..
        
        # Remove node_modules
        echo "Removing node_modules..."
        rm -rf node_modules apps/*/node_modules packages/*/node_modules
        
        # Pull latest
        echo "Pulling latest changes..."
        git pull origin main
        
        # Fresh install
        echo "Installing dependencies..."
        npm install
        
        # Build
        echo "Building packages..."
        npm run build
        
        # Recreate containers
        echo "Creating containers..."
        cd infra
        docker compose up -d
        cd ..
        
        # Wait for services
        echo "Waiting for services..."
        sleep 5
        
        # Set up database
        echo "Setting up database..."
        cd apps/api
        npm run prisma:migrate
        cd ../..
        
        echo "✓ Fresh install complete!"
        ;;
        
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "Update complete! Run 'npm run dev' to start development servers."
