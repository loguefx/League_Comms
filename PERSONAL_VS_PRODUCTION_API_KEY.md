# Personal API Key vs Production API Key

## Quick Answer

**For now (development/testing):** Use **Personal API Key** or **Development API Key**

**Later (when releasing):** Get **Production API Key**

## The Difference

### Personal/Development API Key

**What it is:**
- For individual developers and testing
- Easier to get (usually instant)
- Higher rate limits for development
- **Expires after 24 hours** (you need to get a new one daily)

**Best for:**
- ✅ Development and testing
- ✅ Learning and experimenting
- ✅ Building your app
- ✅ Testing with a few users

**Limitations:**
- ❌ Expires every 24 hours (annoying for ongoing development)
- ❌ Not meant for production/public use
- ❌ May have usage restrictions

### Production API Key

**What it is:**
- For applications that will be used by others
- Requires Riot approval (may take time)
- **Doesn't expire** (permanent)
- Meant for public/distributed apps

**Best for:**
- ✅ Releasing your app to users
- ✅ Public distribution
- ✅ Long-term use
- ✅ Apps that will be used by many people

**Requirements:**
- ⚠️ May require application review
- ⚠️ Need to demonstrate your app follows Riot's policies
- ⚠️ May take time to get approved

## What You Should Do

### Phase 1: Development (Now)

**Get a Personal/Development API Key:**
1. It's faster to get
2. Good for testing and building
3. You can start working immediately
4. You'll need to get a new one daily (or every 24 hours)

**How to get it:**
- Look for **"Development Key"** or **"Personal API Key"**
- Usually available immediately
- No approval needed

### Phase 2: Production (When Ready to Release)

**Get a Production API Key:**
1. Apply for it when your app is ready
2. May require showing Riot your app
3. Once approved, it doesn't expire
4. Perfect for distributing to users

**How to get it:**
- Look for **"Production API Key"** or **"Request Production Key"**
- Fill out the application form
- Wait for Riot approval
- Use it in your production `.env` file

## For Your Project

Since you want this to work for **everyone who installs it**, you'll eventually need a **Production API Key**.

**But for now:**
- ✅ Start with **Personal/Development API Key**
- ✅ Build and test your app
- ✅ Get everything working
- ✅ Then apply for **Production API Key** when ready to release

## How to Switch Later

When you're ready for production:

1. **Apply for Production API Key** in Riot Developer Portal
2. **Get approved** (may take a few days/weeks)
3. **Update your `.env` file:**
   ```env
   RIOT_API_KEY=your-production-api-key-here
   ```
4. **Deploy your app** with the production key

## Important Notes

### Development Keys Expire

- Development keys expire after **24 hours**
- You'll need to get a new one daily during development
- This is annoying but normal for development

### Production Keys Don't Expire

- Once you get a production key, it's permanent
- No need to renew it
- Perfect for released apps

### You Can Have Both

- You can have a development key for testing
- And a production key for release
- Use different keys in different environments

## Recommendation

**Right now:**
1. Get a **Personal/Development API Key**
2. Use it to build and test
3. Accept that you'll need to renew it daily

**When your app is ready:**
1. Apply for **Production API Key**
2. Wait for approval
3. Switch to production key
4. Release your app!

## Summary

| Type | When to Use | Expires? | Approval Needed? |
|------|-------------|----------|-------------------|
| **Personal/Development** | Now (development) | Yes (24 hours) | No |
| **Production** | Later (release) | No (permanent) | Yes |

**Start with Personal/Development, switch to Production when ready!**
