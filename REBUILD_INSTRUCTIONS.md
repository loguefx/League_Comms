# Fix TypeScript Errors After Git Pull

If you're getting TypeScript errors about `puuid` not existing on `LeagueEntry` after pulling the latest changes, follow these steps:

## Quick Fix (Ubuntu/Linux/Mac)

```bash
# From the project root
cd packages/riot
npm run build
cd ../../apps/api
npm run dev
```

## Quick Fix (Windows PowerShell)

```powershell
# From the project root
cd packages/riot
npm run build
cd ..\..\apps\api
npm run dev
```

## Why This Happens

The `@league-voice/riot` package needs to be rebuilt after changes to update the compiled TypeScript type definitions (`.d.ts` files) that other packages use.

## Alternative: Rebuild All Packages

From the project root:

```bash
npm run build
```

This will rebuild all packages in the monorepo.
