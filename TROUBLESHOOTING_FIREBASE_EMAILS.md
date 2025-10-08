# Firebase Email Troubleshooting Guide

## Current Status (from latest test)

✅ **Verification email**: Coming from `subscriptions@reviewsandmarketing.com`  
❌ **Verification email content**: Missing benefits + security notes  
❌ **Password reset**: Coming from `noreply@reviewpilot2.firebaseapp.com` (Firebase default)

---

## Root Cause Analysis

### Issue 1: Password Reset from Wrong Sender

**Symptoms:**
- Password reset emails come from `noreply@reviewpilot2.firebaseapp.com`
- Uses plain Firebase template
- No branding or custom content

**Possible Causes:**
1. Firebase Console SMTP settings weren't saved
2. SMTP settings only apply to verification emails, not password resets
3. Firebase has template-specific sender overrides

**How to Check:**
1. Go to Firebase Console → Authentication → Templates → **SMTP settings**
2. Verify all fields are filled and click "Save" again
3. Go to **Password reset** template
4. Check if there's a "From" field that overrides SMTP settings
5. If there is, change it to `subscriptions@reviewsandmarketing.com`

### Issue 2: Verification Email Missing Content

**Symptoms:**
- Email comes from correct sender (`subscriptions@reviewsandmarketing.com`)
- Has gradient header and button
- Missing: benefit bullets, security note

**Possible Causes:**
1. Email client (Mailinator) stripping HTML content
2. HTML rendering issue in template
3. Our Postmark API not sending full HTML

**How to Test:**
1. Register with a Gmail or Outlook address (not Mailinator)
2. Check if benefits show up in a full email client
3. Check Postmark Activity dashboard to see the actual HTML sent

---

## Action Items

### For CEO (You):

1. **Verify Firebase SMTP Settings:**
   - Go to: Firebase Console → reviewpilot2 → Authentication → Templates → SMTP settings
   - Confirm "Enable" is checked
   - Click "Save" again (even if it looks saved)
   - Take a screenshot of the saved settings

2. **Check Password Reset Template:**
   - Go to: Templates → Password reset
   - Look for "From" or "Sender" field
   - If it shows `noreply@reviewpilot2.firebaseapp.com`, change it to `subscriptions@reviewsandmarketing.com`
   - Click "Save"

3. **Check Verification Template:**
   - Go to: Templates → Email address verification
   - Verify "From" field is `subscriptions@reviewsandmarketing.com`
   - Click "Save"

### For Tester:

1. **Test with Real Email Client:**
   - Instead of Mailinator, use a Gmail or Outlook.com address
   - Mailinator may strip certain HTML elements
   - Check if benefits and security notes appear

2. **Check Postmark Dashboard:**
   - Log in to Postmark: https://account.postmarkapp.com
   - Go to Activity
   - Find the test emails
   - Click "View HTML" to see what was actually sent
   - If HTML is correct there, it's an email client rendering issue

3. **Test Again After SMTP Resave:**
   - After CEO resaves SMTP settings
   - Register new account: `aftersave2025@mailinator.com`
   - Request password reset
   - Report which sender both emails come from

---

## If SMTP Settings Keep Reverting

Firebase Spark (free) plan has limitations. If SMTP settings won't save:

**Option A: Upgrade to Blaze Plan**
- Firebase Spark plan may restrict custom SMTP
- Blaze (pay-as-you-go) allows custom SMTP
- First $0.10/email x 10 emails = $1/month max

**Option B: Disable Firebase Email Templates**
- Go to each template (Verification, Password Reset)
- Clear ALL fields (make them empty)
- Save
- This forces our API to handle all emails

**Option C: Use Action Code Settings**
- In our code, we already use custom action URLs
- Firebase should redirect to our domain
- Our domain can then send the branded email
- Let me implement this fallback...

---

## Next Steps

1. **CEO**: Check Firebase Console settings (steps above) and report back
2. **Tester**: Test with Gmail/Outlook instead of Mailinator
3. **Dev** (me): I'll implement a fallback that intercepts Firebase action codes

Let me know the results and I'll proceed with the appropriate fix.
