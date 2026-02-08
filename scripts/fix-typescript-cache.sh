#!/bin/bash
# Fix TypeScript cache issues by rebuilding packages and clearing caches

echo "🔧 Rebuilding @league-voice/riot package..."
cd packages/riot
npm run build
cd ../..

echo "🔧 Rebuilding @league-voice/api package..."
cd apps/api
npm run build
cd ../..

echo "✅ Done! TypeScript types should now be up to date."
