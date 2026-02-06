#!/usr/bin/env node

/**
 * Auto-generate .env file with default values
 * This script creates apps/api/.env if it doesn't exist
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', 'apps', 'api', '.env');
const envDir = path.dirname(envPath);

// Default .env content
const defaultEnvContent = `# ============================================
# DATABASE CONFIGURATION
# ============================================
# SQLite (no Docker needed) - Default for development
DATABASE_URL="file:./dev.db"

# PostgreSQL (if using Docker) - Uncomment to use
# DATABASE_URL="postgresql://league_voice:league_voice_dev@localhost:5432/league_voice?schema=public"

# ============================================
# REDIS CONFIGURATION
# ============================================
# Set to 'false' to use in-memory cache (no Docker needed)
USE_REDIS=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d

# ============================================
# RIOT API CREDENTIALS
# ============================================
# IMPORTANT: Get these from https://developer.riotgames.com/
# 1. Create an application
# 2. Add redirect URI: http://localhost:4000/auth/riot/callback
# 3. Copy your credentials below
# 
# For PRODUCTION: Use Production API Key (not Development key)
# Development keys expire after 24 hours
RIOT_CLIENT_ID=your-riot-client-id-here
RIOT_CLIENT_SECRET=your-riot-client-secret-here
RIOT_API_KEY=your-riot-api-key-here
RIOT_REDIRECT_URI=http://localhost:4000/auth/riot/callback

# ============================================
# CORS CONFIGURATION
# ============================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:1420

# ============================================
# LIVEKIT VOICE SERVER
# ============================================
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_URL=http://localhost:7880

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=4000
FRONTEND_URL=http://localhost:3000

# ============================================
# ENCRYPTION
# ============================================
ENCRYPTION_KEY=dev-key-change-in-production
`;

function createEnvFile() {
  // Create directory if it doesn't exist
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log('✓ .env file already exists at:', envPath);
    console.log('  Skipping creation. Edit it manually if needed.');
    return false;
  }

  // Create .env file
  try {
    fs.writeFileSync(envPath, defaultEnvContent, 'utf8');
    console.log('✓ Created .env file at:', envPath);
    console.log('');
    console.log('⚠️  IMPORTANT: Edit apps/api/.env and add your Riot API credentials!');
    console.log('   Get them from: https://developer.riotgames.com/');
    console.log('   See RIOT_API_SETUP.md for detailed instructions.');
    return true;
  } catch (error) {
    console.error('✗ Failed to create .env file:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createEnvFile();
}

module.exports = { createEnvFile };
