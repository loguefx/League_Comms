# Where OAuth Credentials Are Located

## Important: This Form is NOT Where Credentials Are

The "EDIT APPLICATION" form you're seeing is for:
- Product Name
- Product Description  
- Product URL
- Product Group

**This is NOT where Client ID and Client Secret are shown!**

## Where Client ID and Secret Actually Are

OAuth credentials (Client ID and Client Secret) are typically shown on:
1. **The main Application Dashboard** (not the edit form)
2. **A separate "Credentials" or "OAuth" section**
3. **After you first create the application** (they're shown once)

## How to Find Them

### Step 1: Go Back to the Main Page

1. **Don't submit** the edit form (or submit it if you made changes)
2. **Go back** to the main application/product page
3. Look for a section that shows **credentials** (not the edit form)

### Step 2: Look for These Sections

On the main application page, look for:

**Option A: Credentials Section**
- A section labeled **"Credentials"**
- Or **"OAuth Credentials"**
- Or **"Application Credentials"**
- This should show Client ID and Client Secret

**Option B: Application Details (Not Edit Form)**
- The **view/details page** (not the edit form)
- Should show Client ID and Client Secret in read-only format
- Usually at the top of the page

**Option C: Separate OAuth/RSO Page**
- Look for **"OAuth"** or **"RSO"** in the navigation
- Or a link to **"OAuth Settings"**
- This is where OAuth credentials are managed

### Step 3: Check if You Need to Create OAuth App

**Important**: You might have created a **Product** but not an **OAuth Application** yet!

In Riot's system:
- **Product** = The overall product registration (what you're editing)
- **OAuth Application** = The OAuth app that has Client ID/Secret (separate!)

You may need to:
1. Look for **"Create OAuth Application"** or **"Register OAuth App"**
2. Or find where OAuth applications are managed for your product
3. Create one if it doesn't exist

## What to Look For

When you find the right page, you should see something like:

```
┌─────────────────────────────────────┐
│ OAuth Application                   │
├─────────────────────────────────────┤
│ Client ID:                          │
│ abc123xyz789                        │ ← Visible
│                                     │
│ Client Secret:                      │
│ [Show] ••••••••••••••               │ ← Click to reveal
│                                     │
│ Redirect URIs:                      │
│ • http://192.168.0.159:4000/...    │
└─────────────────────────────────────┘
```

## Navigation Tips

### Try These Paths:

1. **From the edit form:**
   - Click **"Cancel"** or go back
   - Look for **"Credentials"** or **"OAuth"** section on the main page

2. **Check the tabs:**
   - Look for tabs like: **"Overview"**, **"Credentials"**, **"OAuth"**, **"RSO"**
   - Click through them to find credentials

3. **Check the sidebar:**
   - Look for **"OAuth Applications"**
   - Or **"Application Settings"**
   - Or **"Credentials"**

4. **Look for a "View" mode:**
   - The edit form is for editing
   - There should be a **"View"** or **"Details"** page
   - Credentials are usually shown there (not in edit mode)

## If You Can't Find Them

### You Might Need to Create an OAuth Application:

1. Look for **"Create OAuth Application"** or **"Register Application"**
2. This is separate from the Product registration
3. When you create it, you'll see Client ID and Secret immediately
4. They're usually shown **once** when first created

### Check Different Sections:

- **Products** section (what you're in now)
- **Applications** section (separate - has OAuth credentials)
- **OAuth** section (dedicated OAuth management)
- **RSO** section (Riot Sign On - has credentials)

## Quick Actions

1. **Go back** from the edit form to the main page
2. **Look for "Credentials"** section (not in edit mode)
3. **Check all tabs** (Overview, Details, OAuth, etc.)
4. **Look for "Create OAuth Application"** if you haven't created one yet
5. **Check if "App ID" from the details page** is your Client ID

## Important Note

The **"App ID"** you saw on the Details page might actually be your **Client ID**!

- Check the Details page (not edit form)
- The "App ID" in General Info might be it
- You still need to find the **Client Secret** though

The Client ID and Secret are definitely somewhere - they're just not in the edit form. They're on the **view/details page** or in a **separate OAuth section**!
