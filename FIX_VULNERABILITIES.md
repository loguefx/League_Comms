# Fixing npm Security Vulnerabilities

## Current Status
- 20 vulnerabilities (5 low, 4 moderate, 11 high)
- Deprecation warnings for `glob` and `eslint`

## Step 1: Try Safe Fix First

```bash
# Try to fix vulnerabilities without breaking changes
npm audit fix
```

This will update packages to compatible versions that fix vulnerabilities without breaking changes.

## Step 2: Check What's Left

```bash
# See detailed vulnerability report
npm audit
```

## Step 3: If Issues Remain

### Option A: Force Fix (May Break Things)

```bash
# Force fix all vulnerabilities (may cause breaking changes)
npm audit fix --force
```

**Warning:** This may update packages to incompatible versions. Test your app after running this.

### Option B: Manual Update (Safer)

Check which packages have vulnerabilities:

```bash
npm audit --json | grep -A 5 "vulnerabilities"
```

Then update specific packages:

```bash
# Update vulnerable packages manually
npm update glob eslint
npm install glob@latest eslint@latest
```

## Step 4: Update Deprecated Packages

```bash
# Update glob (has security vulnerabilities)
npm install glob@latest --save-dev

# Update eslint (no longer supported)
npm install eslint@latest --save-dev
```

## Step 5: Rebuild After Updates

```bash
# Rebuild packages after updates
npm run build
```

## Recommended Approach

1. **First, try safe fix:**
   ```bash
   npm audit fix
   ```

2. **Check remaining issues:**
   ```bash
   npm audit
   ```

3. **If high/critical vulnerabilities remain:**
   ```bash
   # Review what will change
   npm audit fix --dry-run
   
   # Then apply if safe
   npm audit fix --force
   ```

4. **Update deprecated packages:**
   ```bash
   npm install glob@latest eslint@latest
   ```

5. **Test your application:**
   ```bash
   npm run dev
   ```

## Understanding the Warnings

- **glob vulnerabilities**: Old versions have security issues, update to latest
- **eslint deprecation**: Version 8.57.1 is no longer supported, consider upgrading to v9
- **20 vulnerabilities**: Mix of low, moderate, and high severity issues

## After Fixing

Run the setup script again to ensure everything works:

```bash
./setup-linux.sh
```

Or continue with development:

```bash
npm run dev
```
