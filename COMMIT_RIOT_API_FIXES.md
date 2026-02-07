# How to Commit and Push the Riot API Fixes

## Summary of Changes

✅ **Updated all Riot API clients to use `?api_key=` query parameter format:**
- `packages/riot/src/summoner-client.ts` - 4 methods updated
- `packages/riot/src/match-client.ts` - 2 methods updated  
- `packages/riot/src/spectator-client.ts` - 1 method updated
- `RIOT_API_ENDPOINTS.md` - New documentation file

## Step 1: Review the Changes

Check what files were modified:
```bash
git status
```

You should see:
- Modified: `packages/riot/src/summoner-client.ts`
- Modified: `packages/riot/src/match-client.ts`
- Modified: `packages/riot/src/spectator-client.ts`
- New file: `RIOT_API_ENDPOINTS.md`

## Step 2: Stage the Changes

Stage only the Riot API fixes:
```bash
git add packages/riot/src/summoner-client.ts
git add packages/riot/src/match-client.ts
git add packages/riot/src/spectator-client.ts
git add RIOT_API_ENDPOINTS.md
```

Or stage all changes at once:
```bash
git add packages/riot/src/ RIOT_API_ENDPOINTS.md
```

## Step 3: Commit the Changes

```bash
git commit -m "Update Riot API clients to use api_key query parameter instead of X-Riot-Token header"
```

## Step 4: Push to Your Repository

```bash
git push origin main
```

(Replace `main` with your branch name if different)

## Verify the Changes

After pushing, you can verify the changes were applied by checking:
- All API URLs now use `?api_key=${this.config.apiKey}` format
- No more `X-Riot-Token` headers in the API client files

## If You Want to Pull These Changes on Another Machine

On another machine, pull the latest changes:
```bash
git pull origin main
```

Then rebuild if needed:
```bash
npm run build
```
