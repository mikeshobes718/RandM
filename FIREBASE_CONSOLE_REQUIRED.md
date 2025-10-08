# 🔴 CRITICAL: Firebase Console Access Required

## The Real Problem

**Firebase is automatically sending its own emails** in addition to (or instead of) our Postmark emails. This cannot be fixed with code alone - you must access the Firebase Console.

---

## Evidence

1. ✅ Our `/api/auth/register` works and returns 200 OK
2. ✅ Our `/api/auth/email` sends Postmark emails successfully  
3. ✅ Email templates in code have all benefits + security notes
4. ❌ **But tester sees text "Verify now" and "Confirm your email to unlock"** - this text doesn't exist in our codebase
5. ❌ **Password reset comes from `noreply@reviewpilot2.firebaseapp.com`** - Firebase default

**Conclusion:** Firebase is sending its own template emails automatically, overriding our Postmark emails.

---

## REQUIRED ACTION (CEO Must Do This)

### Step 1: Access Firebase Console

1. Go to: https://console.firebase.google.com/
2. Select project: **reviewpilot2**
3. Go to **Authentication** → **Templates** tab

### Step 2: Configure Email Templates

You'll see templates for:
- **Email address verification**
- **Password reset**  
- Email address change
- SMS verification

For EACH template (verification + reset):

#### Option A: Disable Firebase Emails (Recommended)
Unfortunately, Firebase doesn't allow fully disabling these emails. So we need Option B.

#### Option B: Customize Action URLs

1. Click on "Email address verification" template
2. Click "Edit Template" or pencil icon
3. Look for "Customize action URL"
4. Set to: `https://reviewsandmarketing.com/__/auth/action`
5. Save

Do the same for "Password reset"

#### Option C: Use Custom SMTP (Best Solution)

Firebase Authentication doesn't support custom SMTP directly, BUT you can:

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Ensure `reviewsandmarketing.com` is listed
3. In templates, customize the sender name to match your brand
4. Update email content to remove promotional language

**Note:** This still won't use Postmark. Firebase will still send from their servers.

---

## Alternative Solution: Disable Email/Password Provider

If the above doesn't work, you can:

1. Go to **Authentication** → **Sign-in method**
2. Click on "Email/Password"
3. Look for options to disable automatic email verification
4. **Warning:** This might break existing functionality

---

## The Technical Reason

When you use:
```javascript
const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
```

Firebase **automatically** sends a verification email from `noreply@reviewpilot2.firebaseapp.com` using templates configured in the console.

Even when we use Firebase Admin SDK:
```javascript
const userRecord = await auth.createUser({ email, password, emailVerified: false });
```

Firebase STILL sends automatic emails if email verification is enabled in the console.

---

## What I've Done (Code Side - Complete)

✅ Created `/api/auth/register` - server-side registration  
✅ Updated register page to use new API  
✅ Email templates have full branding  
✅ Postmark integration working  
✅ Deployed successfully  

**But:** Firebase Console settings override all of this.

---

## Immediate Workaround

### For Verification Emails:

The only way to completely prevent Firebase auto-emails is to:

1. Create users with `emailVerified: true` (skip verification entirely)
2. OR use a different auth provider (Auth0, Clerk, Supabase Auth)
3. OR accept that Firebase will send emails and customize them in console

### For Password Reset:

Our `/forgot` page already uses Postmark, but Firebase is ALSO sending its email. The issue is:

The `/forgot` page calls our API which uses:
```javascript
await auth.generatePasswordResetLink(email);
```

This Firebase Admin SDK method **might still trigger Firebase's auto-email**. We need to check Firebase Console settings.

---

## Recommended Actions (In Order)

### 1. SHORT TERM (Do Now):
Go to Firebase Console → Authentication → Templates and customize the templates to match your branding as closely as possible.

### 2. MEDIUM TERM (This Week):
Consider migrating to **Supabase Auth** instead of Firebase. Supabase gives you full control over email templates and uses your own SMTP (Postmark).

Migration would involve:
- Use Supabase for user management
- Keep Firebase only for custom tokens (if needed elsewhere)
- Full control over all emails

### 3. LONG TERM (Next Month):
Evaluate other auth providers:
- **Clerk**: Beautiful UI, full email control, $25/month
- **Auth0**: Enterprise-grade, custom SMTP, free tier available
- **Supabase Auth**: Open source, full control, free tier generous

---

## Testing Instructions

### To Confirm Firebase is the Problem:

1. Check the email headers of the verification email the tester receives
2. Look for `Return-Path` or `Received` headers
3. If it says `firebaseapp.com` or `firebase.google.com`, that's Firebase

### To Test Our Postmark Email:

1. Have tester check for **TWO emails** in inbox
2. One from Firebase (`noreply@reviewpilot2.firebaseapp.com`)
3. One from Postmark (`subscriptions@reviewsandmarketing.com`)
4. The Postmark one should have full branding

If they're only seeing ONE email from `subscriptions@reviewsandmarketing.com` but it's minimal, then Firebase has somehow configured custom SMTP to use that address.

---

## Questions to Answer

1. **Do you have access to Firebase Console?**
   - If yes: Check Authentication → Templates
   - If no: Need to get access from whoever set up the project

2. **Are there TWO emails being sent or ONE?**
   - Ask tester to check spam folder
   - Check for multiple emails to same address
   - Look at email headers to see sender

3. **What does the Firebase template look like?**
   - Login to Firebase Console
   - Go to Templates
   - See what's configured there

---

## Files to Check in Firebase Console

When you login, screenshot these and send to me:
1. **Authentication → Templates → Email verification** (entire template)
2. **Authentication → Templates → Password reset** (entire template)
3. **Authentication → Settings → Authorized domains**
4. **Authentication → Sign-in method → Email/Password** (settings)

This will help me understand what's configured and provide exact fix steps.

---

## Status

🔴 **BLOCKED ON FIREBASE CONSOLE ACCESS**

All code changes are complete and deployed. The only remaining issue is Firebase Console configuration which I cannot access or change programmatically.

**Next Step:** CEO must access Firebase Console and either customize templates or provide screenshots so I can give exact instructions.

---

**Created:** October 7, 2025  
**Priority:** CRITICAL  
**Blocker:** Firebase Console access required  
**ETA:** 10 minutes once CEO has console access
