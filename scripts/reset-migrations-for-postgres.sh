#!/bin/bash

# Script to reset migrations when switching from SQLite to PostgreSQL
# Usage: bash scripts/reset-migrations-for-postgres.sh

echo "🔄 Resetting Prisma migrations for PostgreSQL..."

cd "$(dirname "$0")/../apps/api" || exit 1

# Check if migrations directory exists
if [ -d "prisma/migrations" ]; then
  echo "📁 Found existing migrations directory"
  echo "🗑️  Removing old SQLite migrations..."
  rm -rf prisma/migrations
  echo "✅ Removed old migrations"
else
  echo "ℹ️  No existing migrations directory found"
fi

# Check if migration_lock.toml exists
if [ -f "prisma/migration_lock.toml" ]; then
  echo "🗑️  Removing old migration_lock.toml..."
  rm prisma/migration_lock.toml
  echo "✅ Removed migration_lock.toml"
else
  echo "ℹ️  No migration_lock.toml found"
fi

echo ""
echo "✅ Migration directory reset complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure PostgreSQL is running and DATABASE_URL is correct"
echo "   2. Run: npm run prisma:migrate"
echo "   3. This will create a new migration history for PostgreSQL"
