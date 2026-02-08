#!/usr/bin/env node

/**
 * Script to fix DATABASE_URL in .env file to use PostgreSQL format
 * Usage: node scripts/fix-postgres-url.js
 */

const fs = require('fs');
const path = require('path');

// Try multiple possible locations for .env file
const possiblePaths = [
  path.join(__dirname, '..', 'apps', 'api', '.env'),
  path.join(__dirname, '..', 'prisma', '.env'),
  path.join(__dirname, '..', '.env'),
];

let envPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    envPath = p;
    break;
  }
}

if (!envPath) {
  console.error('❌ .env file not found in any of these locations:');
  possiblePaths.forEach(p => console.error(`   - ${p}`));
  console.error('\n   Please create it first or run: npm run create-env');
  process.exit(1);
}

console.log(`📁 Found .env file at: ${envPath}`);

// Read current .env
let envContent = fs.readFileSync(envPath, 'utf8');

// Check current DATABASE_URL
const currentMatch = envContent.match(/^DATABASE_URL=(.*)$/m);
if (currentMatch) {
  const currentUrl = currentMatch[1].replace(/^["']|["']$/g, ''); // Remove quotes
  console.log(`📋 Current DATABASE_URL: ${currentUrl.substring(0, 50)}...`);
  
  if (currentUrl.startsWith('postgresql://') || currentUrl.startsWith('postgres://')) {
    console.log('✅ DATABASE_URL already has correct PostgreSQL format!');
    process.exit(0);
  }
}

// Update DATABASE_URL to PostgreSQL
const postgresUrl = 'postgresql://postgres:Raymond7681@localhost:5432/LVC?schema=public';

// Replace DATABASE_URL line
if (envContent.includes('DATABASE_URL=')) {
  // Replace existing DATABASE_URL (handles both quoted and unquoted)
  envContent = envContent.replace(
    /^DATABASE_URL=.*$/gm,
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
