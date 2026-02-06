# Verify .env File Exists

## The file exists! It's just hidden.

The script says: `✓ .env file already exists at: /home/vboxuser/League_Comms/apps/api/.env`

Files starting with `.` are **hidden** in Linux. You need to use special commands to see them.

## How to View the .env File

### Method 1: List with -a flag (shows hidden files)

```bash
cd ~/League_Comms/apps/api
ls -la | grep env
```

You should see `.env` in the list.

### Method 2: View the file contents

```bash
cat ~/League_Comms/apps/api/.env
```

This will show all the contents of the file.

### Method 3: Edit the file

```bash
nano ~/League_Comms/apps/api/.env
```

Or:

```bash
cd ~/League_Comms/apps/api
nano .env
```

### Method 4: Check if file exists

```bash
test -f ~/League_Comms/apps/api/.env && echo "File exists!" || echo "File does not exist"
```

## Quick Verification Commands

Run these to confirm the file exists:

```bash
# 1. Check if file exists
ls -la ~/League_Comms/apps/api/.env

# 2. View first few lines
head -20 ~/League_Comms/apps/api/.env

# 3. Count lines (should be around 30+)
wc -l ~/League_Comms/apps/api/.env

# 4. Check file size (should be > 0)
stat ~/League_Comms/apps/api/.env
```

## If the File is Empty

If the file exists but is empty (0 bytes), you can recreate it:

```bash
cd ~/League_Comms/apps/api
rm .env
cd ~/League_Comms
npm run create-env
```

## Next Steps

Once you've verified the file exists:

1. **View it:**
   ```bash
   cat ~/League_Comms/apps/api/.env
   ```

2. **Edit it with your Riot API credentials:**
   ```bash
   nano ~/League_Comms/apps/api/.env
   ```

3. **Replace the placeholder values:**
   - `RIOT_CLIENT_ID=your-riot-client-id-here`
   - `RIOT_CLIENT_SECRET=your-riot-client-secret-here`
   - `RIOT_API_KEY=your-riot-api-key-here`

4. **Save and continue setup!**
