# Fix Prisma Client Column Mapping Issue

If you're getting the error: `The column 'matches.matchId' does not exist in the current database`

But when you try to rename columns, you get: `column "matchId" does not exist`

This means:
- ✅ Your database already has the correct column names (`match_id`, `queue_id`, etc.)
- ❌ Prisma client is not using the `@map` directives correctly

## Solution: Regenerate Prisma Client

The Prisma client needs to be regenerated to pick up the `@map` directives from the schema.

### On Ubuntu/Linux:

```bash
cd apps/api
npx prisma generate
```

### On Windows:

```powershell
cd apps\api
npx prisma generate
```

### Verify the Fix:

After regenerating, check that Prisma is using the correct column names by looking at the generated client:

```bash
# The generated types should show @map directives are being used
cat node_modules/.prisma/client/index.d.ts | grep -A 5 "model Match"
```

### If It Still Doesn't Work:

1. **Delete node_modules and reinstall:**
   ```bash
   rm -rf node_modules
   npm install
   npx prisma generate
   ```

2. **Clear Prisma cache:**
   ```bash
   rm -rf node_modules/.prisma
   npx prisma generate
   ```

3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

## Why This Happens:

Prisma uses `@map` directives to map TypeScript field names (camelCase) to database column names (snake_case). When you pull changes or update the schema, the Prisma client must be regenerated to pick up these mappings.
