# Quick Fix for npm Vulnerabilities

## Fast Fix (Recommended)

Run these commands in order:

```bash
# 1. Try safe automatic fix
npm audit fix

# 2. Update deprecated packages
npm install glob@latest eslint@latest --save-dev

# 3. Check remaining issues
npm audit

# 4. If high vulnerabilities remain, force fix
npm audit fix --force

# 5. Rebuild
npm run build
```

## What This Does

- `npm audit fix`: Updates packages to fix vulnerabilities without breaking changes
- Updates `glob` and `eslint` to latest versions (fixes deprecation warnings)
- `npm audit fix --force`: Fixes remaining issues (may cause breaking changes)
- Rebuilds packages to ensure everything still works

## After Fixing

Continue with setup:

```bash
./setup-linux.sh
# Or if already run:
npm run dev
```

## Note

The vulnerabilities are mostly in development dependencies. Your production app should still work, but it's good to fix them for security.
