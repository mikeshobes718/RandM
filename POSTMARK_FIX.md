# Fix: Postmark Email Verification Error

## The Error
```
Failed to send verification email: Email send failed: Request does not contain a valid Server token.
```

## Root Cause
The `POSTMARK_SERVER_TOKEN` environment variable is either:
1. Not set in Vercel
2. Set to an invalid/expired value
3. Set to an empty string

## Solution: Add/Update the Postmark Token in Vercel

### Step 1: Get Your Postmark Server Token
1. Log in to your Postmark account at https://account.postmarkapp.com
2. Go to **Servers** in the sidebar
3. Select your server (or create one if you don't have one)
4. Go to the **API Tokens** tab
5. Copy your **Server API Token** (it looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Step 2: Add Token to Vercel
1. Go to https://vercel.com/dashboard
2. Select your **reviewsandmarketing** project
3. Go to **Settings** → **Environment Variables**
4. Look for `POSTMARK_SERVER_TOKEN`:
   - If it exists: Click **Edit** and update the value
   - If it doesn't exist: Click **Add New**
5. Set:
   - **Name**: `POSTMARK_SERVER_TOKEN`
   - **Value**: Your Postmark server token (paste it)
   - **Environment**: Select **Production**, **Preview**, and **Development**
6. Click **Save**

### Step 3: Redeploy
After saving the environment variable, you MUST redeploy:

**Option A: Trigger from Vercel Dashboard**
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**

**Option B: Deploy from Terminal**
```bash
cd /Users/mike/Documents/reviewsandmarketing
vercel --prod
```

**Option C: Push a Change (Auto-Deploy)**
```bash
cd /Users/mike/Documents/reviewsandmarketing
git commit --allow-empty -m "redeploy: fix postmark token"
git push origin main
```

### Step 4: Verify the Fix
1. Go to https://reviewsandmarketing.com/register
2. Create a test account with a real email address
3. You should be redirected to the verification page
4. Check your email inbox for the verification link
5. If you see "Verification email sent!" → ✅ Fixed!

## Alternative: Check Current Environment Variables

To see what environment variables are currently set in Vercel:

1. In Vercel Dashboard → Settings → Environment Variables
2. Look for these required variables:
   - `POSTMARK_SERVER_TOKEN` ← **This one is likely missing or wrong**
   - `EMAIL_FROM` (should be an email address you verified in Postmark)
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`

## Still Not Working?

### Test the API Directly
```bash
curl -X POST https://reviewsandmarketing.com/api/auth/email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test@email.com","type":"verify"}'
```

If you get a JSON response with `{"ok":true}` → Postmark is working!

### Check Postmark Sender Domain
1. In Postmark → **Sender Signatures** or **Domains**
2. Make sure your `EMAIL_FROM` domain is verified
3. If using `noreply@reviewsandmarketing.com`, verify the `reviewsandmarketing.com` domain in Postmark
4. Follow Postmark's DNS setup instructions to add:
   - DKIM records
   - Return-Path (CNAME)
   - SPF (if not already set)

### Check Vercel Logs
1. Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Go to **Functions** tab
4. Click on a function like `api/auth/email`
5. Look for error logs mentioning "postmark" or "token"

## Summary Checklist
- [ ] Got Postmark Server Token from Postmark dashboard
- [ ] Added `POSTMARK_SERVER_TOKEN` to Vercel environment variables
- [ ] Set environment variable for Production, Preview, and Development
- [ ] Redeployed the application
- [ ] Tested registration flow
- [ ] Received verification email successfully

---

**Need Help?**
- Postmark Support: https://postmarkapp.com/support
- Vercel Environment Variables Docs: https://vercel.com/docs/projects/environment-variables

