# Quick Fix for npm Vulnerabilities

## Fast Fix (Recommended for Fresh Setup)

Since you're setting up fresh, you can safely fix all vulnerabilities:

```bash
# Fix all vulnerabilities (including breaking changes)
npm audit fix --force

# Rebuild packages
npm run build

# Test it works
npm run dev
```

## What This Does

- Updates `webpack` to fix SSRF vulnerabilities
- Updates `inquirer` and related packages
- Updates `@nestjs/cli` (may be a breaking change, but usually fine)
- Fixes all 20 vulnerabilities

## After Fixing

Continue with your setup:

```bash
# If setup script didn't complete
./setup-linux.sh

# Or continue manually
cd infra
docker compose up -d
cd ../apps/api
npm run prisma:generate
npm run prisma:migrate
cd ../..
npm run dev
```

## Note

The breaking change warning is usually safe for development. These are dev dependencies, not production code. Your app should still work fine.

## Verify Fix

```bash
# Check vulnerabilities are gone
npm audit

# Should show: "found 0 vulnerabilities"
```
