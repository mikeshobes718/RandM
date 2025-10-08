# Firebase Console Fix Instructions

## What I See in Your Screenshots

✅ You have access to Firebase Console  
❌ Email templates are using Firebase defaults  
❌ Sender is `noreply@reviewpilot2.firebaseapp.com`  
❌ Action URL is `reviewpilot2.firebaseapp.com`

## SOLUTION: Configure Custom SMTP with Postmark

### Step 1: Set Up Custom SMTP

1. In Firebase Console, stay on **Authentication** → **Templates**
2. Click the **"SMTP settings"** link (in the left sidebar under Email section)
3. Click **"Configure SMTP"** or **"Custom SMTP"**
4. Enter these values:

```
SMTP Server: smtp.postmarkapp.com
Port: 587
Username: YOUR_POSTMARK_SERVER_TOKEN
Password: YOUR_POSTMARK_SERVER_TOKEN
From Email: subscriptions@reviewsandmarketing.com
From Name: Reviews & Marketing
```

**Your Postmark Token:** `50e2ca3f-c387-4cd0-84a9-ff7fb7928d55`

5. Click **Save**

### Step 2: Update Email Verification Template

Go back to **Templates** → **Email address verification**

Fill in:
- **Sender name:** `Reviews & Marketing`
- **From:** `subscriptions@reviewsandmarketing.com`
- **Reply to:** `support@reviewsandmarketing.com`
- **Subject:** `Verify your email — Welcome to Reviews & Marketing!`
- **Action URL:** `https://reviewsandmarketing.com/__/auth/action`

Click **Save**

### Step 3: Update Password Reset Template

Go to **Templates** → **Password reset**

Fill in:
- **Sender name:** `Reviews & Marketing`
- **From:** `subscriptions@reviewsandmarketing.com`  
- **Reply to:** `support@reviewsandmarketing.com`
- **Subject:** `Reset your password — Reviews & Marketing`
- **Action URL:** `https://reviewsandmarketing.com/__/auth/action`

Click **Save**

---

## ⚠️ IMPORTANT

Firebase templates **override** our Postmark templates when configured. So we have two options:

### Option A: Use Firebase Templates with Custom SMTP
- Configure SMTP above
- Firebase sends via Postmark but uses Firebase's template format
- You lose our custom branding/benefits

### Option B: Disable Firebase Templates (RECOMMENDED)
- Leave templates empty/default
- Firebase won't send emails
- Our code sends branded Postmark emails ✅

**To Choose Option B:**
1. Don't fill in the SMTP settings
2. Don't customize the templates
3. Our code will handle all emails

BUT - Firebase may still send defaults. Let me check if there's a way to truly disable them...

---

## BETTER SOLUTION: Update Action URLs Only

Don't touch SMTP settings. Just update:

### Email Verification:
- **Action URL:** `https://reviewsandmarketing.com/verify-email?mode=verifyEmail&oobCode=%LINK%`

### Password Reset:
- **Action URL:** `https://reviewsandmarketing.com/login?mode=resetPassword&oobCode=%LINK%`

This makes Firebase emails redirect to your domain, where our code can handle the verification using our branded templates.

---

## Test After Changes

1. Have tester register with a new email
2. Check which email they receive
3. Verify it's from `subscriptions@reviewsandmarketing.com`
4. Confirm it has benefits + security notes

---

**Let me know which option you prefer and I'll adjust the code accordingly.**
