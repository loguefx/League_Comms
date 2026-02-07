# Quick Fix - Build API First

## Stop Dev and Build

```bash
# 1. Stop current dev (Ctrl+C)

# 2. Build API
cd ~/League_Comms/apps/api
npm run build

# 3. Check dist exists
ls dist
# Should see main.js

# 4. Start dev
cd ~/League_Comms
npm run dev
```

## That's It!

Once `dist/main.js` exists, `npm run dev` will work.
