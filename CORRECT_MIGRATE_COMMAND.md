# Correct Prisma Migrate Command

## The Error
You tried: `npm run prisma:migratecd ../..`
This doesn't work because commands need to be separated with `&&`.

## Correct Command

Since you're already in `apps/api`, just run:

```bash
npm run prisma:migrate
```

Then go back to root:

```bash
cd ../..
```

## Or Use && to Chain Commands

```bash
npm run prisma:migrate && cd ../..
```

## Complete Sequence (You're Already in apps/api)

```bash
# 1. Run migration (you're already here)
npm run prisma:migrate

# 2. Go back to root
cd ../..

# 3. Start development
npm run dev
```

## Quick Copy-Paste

Since you're in `~/League_Comms/apps/api`, run:

```bash
npm run prisma:migrate
```

Wait for it to finish, then:

```bash
cd ../..
```

Then:

```bash
npm run dev
```

## What && Does

- `&&` means "run the next command only if the previous one succeeded"
- `npm run prisma:migrate && cd ../..` = "run migrate, THEN go back to root"
- Without `&&`, the commands are treated as one command, which fails

## After Migration Succeeds

Continue with:

```bash
# Go back to root
cd ../..

# Configure .env (if not done)
nano apps/api/.env

# Start development
npm run dev
```
