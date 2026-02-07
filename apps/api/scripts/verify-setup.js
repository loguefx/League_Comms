#!/usr/bin/env node

/**
 * Verify API setup and configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying API setup...\n');

let hasErrors = false;

// Check .env file
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at:', envPath);
  console.log('   Run: npm run create-env');
  hasErrors = true;
} else {
  console.log('✅ .env file exists');
  
  // Check required variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const required = [
    'RIOT_CLIENT_ID',
    'RIOT_CLIENT_SECRET',
    'RIOT_API_KEY',
    'RIOT_REDIRECT_URI',
  ];
  
  const missing = required.filter(key => {
    const regex = new RegExp(`^${key}=`, 'm');
    return !regex.test(envContent) || envContent.match(regex)?.[0].includes('your-') || envContent.match(regex)?.[0].includes('here');
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing or placeholder values in .env:');
    missing.forEach(key => console.error(`   - ${key}`));
    hasErrors = true;
  } else {
    console.log('✅ All required environment variables are set');
  }
}

// Check Prisma schema
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Prisma schema not found');
  hasErrors = true;
} else {
  console.log('✅ Prisma schema exists');
}

// Check if database file exists (for SQLite)
const dbPath = path.join(__dirname, '..', 'dev.db');
if (fs.existsSync(dbPath)) {
  console.log('✅ SQLite database file exists');
} else {
  console.log('⚠️  SQLite database file not found (will be created on first run)');
}

// Check node_modules
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ node_modules not found. Run: npm install');
  hasErrors = true;
} else {
  console.log('✅ Dependencies installed');
}

// Check dist folder
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  console.log('⚠️  dist folder not found. Run: npm run build');
} else {
  console.log('✅ API is built');
}

console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Setup verification failed. Please fix the errors above.');
  process.exit(1);
} else {
  console.log('✅ Setup verification passed!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run prisma:generate');
  console.log('2. Run: npm run prisma:migrate');
  console.log('3. Run: npm run dev');
  process.exit(0);
}
