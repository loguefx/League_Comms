# Check if Build Succeeded

## After Running `npm run build`

### If Build Succeeded

You should see:
- No error messages
- `dist/` folder created
- Files like `main.js` in `dist/`

Then continue:

```bash
# Go back to root
cd ~/League_Comms

# Start development
npm run dev
```

### If Build Still Failed

Check what errors you're seeing:

```bash
# Check for dist folder
ls dist

# If dist doesn't exist, build failed
# Check the error messages
```

## Verify Build Success

```bash
# Check if dist folder exists
ls apps/api/dist

# Should see: main.js and other files
```

## After Successful Build

### Step 1: Start Development Servers

```bash
cd ~/League_Comms
npm run dev
```

This starts:
- API server: http://localhost:4000
- Web app: http://localhost:3000

### Step 2: Verify Services

```bash
# Check API health
curl http://localhost:4000/health

# Open web app
xdg-open http://localhost:3000
```

## If Build Failed

Share the error messages and I'll help fix them. The `@ts-ignore` comments should have suppressed the type errors, but there might be other issues.
