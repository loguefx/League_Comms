#!/usr/bin/env node

/**
 * Script to update .env file to use PostgreSQL
 * Usage: node scripts/update-db-to-postgres.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', 'apps', 'api', '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at:', envPath);
  console.error('   Please create it first using: npm run create-env');
  process.exit(1);
}

// Read current .env
let envContent = fs.readFileSync(envPath, 'utf8');

// Update DATABASE_URL to PostgreSQL
const postgresUrl = 'postgresql://postgres:Raymond7681@localhost:5432/LVC?schema=public';

// Replace DATABASE_URL line
if (envContent.includes('DATABASE_URL=')) {
  // Replace existing DATABASE_URL
  envContent = envContent.replace(
    /DATABASE_URL=.*/g,
    `DATABASE_URL="${postgresUrl}"`
  );
} else {
  // Add DATABASE_URL if it doesn't exist
  envContent = `DATABASE_URL="${postgresUrl}"\n${envContent}`;
}

// Write back
fs.writeFileSync(envPath, envContent, 'utf8');

console.log('✅ Updated .env file with PostgreSQL connection:');
console.log(`   DATABASE_URL="${postgresUrl.replace(/:[^:@]+@/, ':****@')}"`);
console.log('');
console.log('📝 Next steps:');
console.log('   1. Make sure PostgreSQL is running');
console.log('   2. Run: cd apps/api && npm run prisma:generate');
console.log('   3. Run: cd apps/api && npm run prisma:migrate');
console.log('   4. Restart your API server');
