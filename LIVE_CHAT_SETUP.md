# Live Chat Widget Setup Guide

## Current Integration

✅ **Crisp Chat is already integrated** into the codebase!

- Component: `src/components/CrispChat.tsx`
- Integration: `src/app/layout.tsx` (line 134)
- Status: Ready to activate (just needs configuration)

---

## Why Crisp Chat?

**Recommended:** Crisp is the best choice for Reviews & Marketing based on:

### Pros
- ✅ **Free plan** with unlimited conversations
- ✅ **Multi-channel** support (website, email, SMS, Messenger, WhatsApp)
- ✅ **Shared inbox** for team collaboration
- ✅ **Mobile apps** (iOS & Android) for on-the-go support
- ✅ **Automated triggers** and chatbots
- ✅ **Visitor tracking** (see what pages they're on)
- ✅ **CRM integration** (track customer history)
- ✅ **Clean, modern UI** that matches your brand
- ✅ **Already integrated** in your codebase!

### Cons
- ❌ Advanced features (chatbots, co-browsing) require paid plans
- ❌ Pro plan starts at $25/month per workspace

### Comparison with Alternatives

| Feature | Crisp (Free) | Intercom | Tawk.to | LiveChat |
|---------|--------------|----------|---------|----------|
| **Price** | Free → $25/mo | $39/mo → $99/mo | Free | $20/mo → $59/mo |
| **Unlimited chats** | ✅ | ❌ (limits) | ✅ | ❌ (limits) |
| **Team members** | 2 → Unlimited | Limited | Unlimited | Limited |
| **Mobile apps** | ✅ | ✅ | ✅ | ✅ |
| **Chatbots** | Paid | Paid | Free | Paid |
| **Setup complexity** | Easy | Medium | Easy | Easy |
| **Brand removal** | Free | Paid | Paid | Paid |
| **Knowledge base** | Paid | Paid | Free | Paid |

**Winner:** Crisp offers the best balance of features, price, and ease of use for a growing SaaS business.

---

## Setup Instructions (5 Minutes)

### Step 1: Create Crisp Account

1. Go to https://crisp.chat/
2. Click **"Try it now free"**
3. Sign up with your email (use `mikeshobes718@yahoo.com` or company email)
4. Choose **"Website Chat"** as your primary channel
5. Enter your website: `reviewsandmarketing.com`

### Step 2: Get Your Website ID

1. After signup, you'll be in the Crisp Dashboard
2. Go to **Settings** → **Website Settings** → **Setup Instructions**
3. Look for your **Website ID** in the code snippet:
   ```javascript
   window.$crisp = [];
   window.CRISP_WEBSITE_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"; // <-- THIS IS YOUR ID
   ```
4. Copy the ID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Step 3: Configure Environment Variable

**Local Development** (`.env.local`):
```bash
NEXT_PUBLIC_CRISP_WEBSITE_ID="your-website-id-here"
```

**Vercel Production**:
```bash
cd /Users/mike/Documents/reviewsandmarketing

# Add to all environments
vercel env add NEXT_PUBLIC_CRISP_WEBSITE_ID production
# Paste your Website ID when prompted

vercel env add NEXT_PUBLIC_CRISP_WEBSITE_ID preview
# Paste your Website ID when prompted

vercel env add NEXT_PUBLIC_CRISP_WEBSITE_ID development
# Paste your Website ID when prompted
```

### Step 4: Deploy

```bash
vercel --prod
```

### Step 5: Test

1. Visit https://reviewsandmarketing.com
2. Look for the Crisp chat widget in the bottom-right corner
3. Send a test message
4. Check your Crisp Dashboard to see the message
5. Reply from the dashboard and verify it appears on the website

---

## Customization

### Brand Colors

1. Go to **Settings** → **Chatbox**
2. Update:
   - **Primary color**: `#6366f1` (matches your indigo brand)
   - **Avatar**: Upload your logo
   - **Welcome message**: "Hi! 👋 How can we help you today?"

### Team Members

1. Go to **Settings** → **Team**
2. Click **"Invite teammate"**
3. Enter email addresses
4. Assign roles (Admin, Member, etc.)

### Automated Triggers

1. Go to **Settings** → **Triggers**
2. Create triggers like:
   - **After 30 seconds**: "Need help getting started?"
   - **On pricing page**: "Questions about our plans?"
   - **Exit intent**: "Before you go, anything we can help with?"

### Availability Hours

1. Go to **Settings** → **Availability**
2. Set your business hours
3. Enable **"Out of office"** message when unavailable
4. Example: "Thanks for reaching out! We're offline right now but will reply within 2 hours."

### Email Notifications

1. Go to **Settings** → **Notifications**
2. Enable:
   - Email notifications for new messages
   - Mobile push notifications (if using mobile app)
   - Daily/weekly summary emails

---

## Features Already Implemented

The `CrispChat` component includes:

### 1. Automatic User Identification
If a user is logged in, their email is automatically set in Crisp:
```typescript
// Automatically pulls from Firebase token
window.$crisp.push(['set', 'user:email', ['user@example.com']]);
```

### 2. Session Data
Tracks custom data about each visitor:
```typescript
window.$crisp.push(['set', 'session:data', [
  ['source', 'website'],
  ['plan', 'visitor'], // Could be enhanced to show Starter/Pro
]]);
```

### 3. Helper Functions
Use these in your code to control the chat widget:

```typescript
import { CrispHelpers } from '@/components/CrispChat';

// Show the chat widget
CrispHelpers.show();

// Hide the chat widget
CrispHelpers.hide();

// Open the chat window
CrispHelpers.open();

// Send a message programmatically
CrispHelpers.sendMessage('Hello from the app!');

// Update user info
CrispHelpers.setUserEmail('user@example.com');
CrispHelpers.setUserName('John Doe');
```

**Example Use Case**: Open chat when user clicks "Need Help?" button
```typescript
<button onClick={() => CrispHelpers.open()}>
  Need Help?
</button>
```

---

## Advanced Configuration

### Hide Chat on Specific Pages

Edit `src/components/CrispChat.tsx`:

```typescript
useEffect(() => {
  if (!crispId) return;

  // Hide on specific routes
  const hideChatRoutes = ['/checkout', '/payment'];
  if (hideChatRoutes.some(route => window.location.pathname.startsWith(route))) {
    CrispHelpers.hide();
    return;
  }

  // ... rest of initialization
}, [crispId]);
```

### Track User Plan in Crisp

Enhance the session data to show Pro/Starter status:

```typescript
// In CrispChat.tsx, after user identification
const planStatus = await fetch('/api/plan/status').then(r => r.json());
window.$crisp.push(['set', 'session:data', [
  ['source', 'website'],
  ['plan', planStatus.plan || 'starter'],
  ['subscription_status', planStatus.status || 'none'],
]]);
```

### Crisp API Integration

Crisp has a REST API to:
- Send messages programmatically
- Update user profiles
- Create conversations from your app
- Integrate with other tools

API Docs: https://docs.crisp.chat/api/v1/

---

## Mobile Apps

**Download Crisp Apps**:
- iOS: https://apps.apple.com/app/crisp/id1039290918
- Android: https://play.google.com/store/apps/details?id=im.crisp.client

Benefits:
- Reply to customers from your phone
- Get instant push notifications
- See visitor browsing activity
- Access customer history

---

## Analytics & Reporting

Crisp Dashboard includes:
- **Conversation volume** (daily, weekly, monthly)
- **Response time** metrics
- **Customer satisfaction** ratings (CSAT)
- **Team performance** (messages per agent, resolution time)
- **Popular pages** (where users start chats)
- **Export data** to CSV

---

## Integrations

Crisp integrates with:
- **Slack** (get notifications in Slack)
- **Gmail** (reply from email)
- **Zapier** (connect to 5000+ apps)
- **Stripe** (see customer subscription status)
- **HubSpot, Salesforce** (CRM sync)

Setup: Go to **Settings** → **Integrations**

---

## Pricing Plans

| Plan | Price | Features |
|------|-------|----------|
| **Basic** | Free | Unlimited conversations, 2 team members, basic features |
| **Pro** | $25/mo/workspace | Unlimited team, chatbots, triggers, scheduling |
| **Unlimited** | $95/mo/workspace | Co-browsing, screen sharing, audio/video calls, priority support |

**Recommendation**: Start with **Basic (Free)** and upgrade to **Pro** ($25/mo) once you have:
- More than 2 support team members
- Need for chatbots and automated responses
- Higher conversation volume

---

## Troubleshooting

### Chat Widget Not Appearing

**Check**:
1. `NEXT_PUBLIC_CRISP_WEBSITE_ID` is set in Vercel
2. Env var format: `NEXT_PUBLIC_*` (must start with this prefix for client-side)
3. Website ID is correct (check Crisp Dashboard)
4. No browser ad blockers (disable to test)
5. Check browser console for errors

**Test Locally**:
```bash
# In .env.local
NEXT_PUBLIC_CRISP_WEBSITE_ID="your-id"

npm run dev
```

### Widget Appears But Not Working

**Check**:
1. Crisp website is active (not paused in dashboard)
2. No JavaScript errors in console
3. Crisp script loaded (look for `https://client.crisp.chat/l.js` in Network tab)

### Messages Not Sending

**Check**:
1. Internet connection
2. Crisp service status: https://status.crisp.chat/
3. Browser console for errors

---

## Alternative Options (If Crisp Doesn't Work)

### 1. Intercom
- **Best for**: Enterprise, advanced automation
- **Pricing**: $39/mo → $99/mo per seat
- **Setup**: Similar to Crisp, requires more configuration
- **When to use**: If you need advanced product tours and in-app messaging

### 2. Tawk.to
- **Best for**: Budget-conscious businesses
- **Pricing**: 100% free (with ads), $19/mo to remove branding
- **Setup**: Very easy, similar to Crisp
- **When to use**: If you want completely free with all features

### 3. LiveChat
- **Best for**: High-volume support teams
- **Pricing**: $20/mo → $59/mo per agent
- **Setup**: Easy, lots of integrations
- **When to use**: If you need advanced ticket management

### 4. Custom Socket.io Chat
- **Best for**: Full control, no third-party
- **Pricing**: Free (but requires development time)
- **Setup**: Complex, need to build from scratch
- **When to use**: If you have specific requirements not met by any provider

---

## Recommended Setup Checklist

- [ ] Create Crisp account
- [ ] Get Website ID
- [ ] Add `NEXT_PUBLIC_CRISP_WEBSITE_ID` to Vercel
- [ ] Deploy to production
- [ ] Test chat widget appears
- [ ] Customize brand colors
- [ ] Set welcome message
- [ ] Configure availability hours
- [ ] Add team members
- [ ] Download mobile app
- [ ] Set up email notifications
- [ ] Create automated triggers
- [ ] Test end-to-end conversation

---

## Support

**Crisp Support**:
- Documentation: https://docs.crisp.chat/
- Status Page: https://status.crisp.chat/
- Help Center: https://help.crisp.chat/

**For Implementation Help**:
- Contact: mikeshobes718@yahoo.com
- Developer: Reference `src/components/CrispChat.tsx`

---

**End of Live Chat Setup Guide**

Crisp Chat is the recommended solution and is already integrated into your codebase. Just add the Website ID and deploy!
