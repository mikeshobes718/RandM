# ⚠️ URGENT: Fix Email Verification

## The Problem
Registration is currently broken because verification emails can't be sent:
```
Failed to send verification email: Email send failed: 
Request does not contain a valid Server token.
```

## The Solution (5 minutes)

### Step 1: Get Your Postmark Token
1. Go to https://account.postmarkapp.com
2. Click **Servers** in sidebar
3. Select your server
4. Go to **API Tokens** tab
5. Copy your **Server API Token**

### Step 2: Add to Vercel
1. Go to https://vercel.com/dashboard
2. Select **reviewsandmarketing** project
3. **Settings** → **Environment Variables**
4. Click **Add New** (or **Edit** if it exists)
5. Set:
   - **Name**: `POSTMARK_SERVER_TOKEN`
   - **Value**: (paste your token from Step 1)
   - **Environment**: Check ALL: Production, Preview, Development
6. Click **Save**

### Step 3: Redeploy
```bash
cd /Users/mike/Documents/reviewsandmarketing
vercel --prod
```

Or just push any change to trigger auto-deploy:
```bash
git commit --allow-empty -m "redeploy: enable postmark"
git push origin main
```

### Step 4: Test
1. Visit https://reviewsandmarketing.com/register
2. Create a test account
3. You should receive the verification email ✅

---

## Why This Happened
The code expects `POSTMARK_SERVER_TOKEN` to be set in Vercel's environment variables, but it's either:
- ❌ Not set at all
- ❌ Set to an empty string
- ❌ Set to an invalid/expired token

## How to Verify It's Fixed
After redeploying, the error message will change from:
```
❌ Request does not contain a valid Server token
```

To:
```
✅ Verification email sent! Check your inbox.
```

---

**See `POSTMARK_FIX.md` for more detailed troubleshooting.**

