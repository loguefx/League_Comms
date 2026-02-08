# Testing API from Windows Command Prompt

## The Problem

Windows CMD interprets `&` as a command separator, so this fails:
```cmd
curl http://192.168.0.159:4000/champions?rank=iron&role=ALL&patch=latest
```

Windows sees it as:
1. `curl http://192.168.0.159:4000/champions?rank=iron`
2. `role=ALL` (separate command - fails)
3. `patch=latest` (separate command - fails)

## Solutions

### Option 1: Use Quotes (Recommended)

```cmd
curl "http://192.168.0.159:4000/champions?rank=iron&role=ALL&patch=latest"
```

### Option 2: Use PowerShell

```powershell
curl "http://192.168.0.159:4000/champions?rank=iron&role=ALL&patch=latest"
```

Or use PowerShell's `Invoke-WebRequest`:
```powershell
Invoke-WebRequest -Uri "http://192.168.0.159:4000/champions?rank=iron&role=ALL&patch=latest"
```

### Option 3: Escape the Ampersands

```cmd
curl http://192.168.0.159:4000/champions?rank=iron^&role=ALL^&patch=latest
```

## Test Commands

### Check if API is running:
```cmd
curl http://192.168.0.159:4000/health
```

### Check diagnostics:
```cmd
curl "http://192.168.0.159:4000/champions/diagnostics"
```

### Query champions (with quotes!):
```cmd
curl "http://192.168.0.159:4000/champions?rank=iron&role=ALL&patch=latest"
```

### Trigger aggregation:
```cmd
curl -X POST "http://192.168.0.159:4000/champions/aggregate"
```

### Check seed progress:
```cmd
curl "http://192.168.0.159:4000/champions/progress"
```
