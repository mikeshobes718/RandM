# Production Setup Checklist

Complete these steps to enable all features in production.

## ✅ Core Features (Already Configured)
- [x] Firebase Authentication
- [x] Postmark Email (EMAIL_FROM, POSTMARK_SERVER_TOKEN)
- [x] Supabase Database
- [x] Stripe Billing
- [x] Google Maps API
- [x] Vercel Deployment
- [x] Domain (reviewsandmarketing.com)

---

## 📧 Newsletter System Setup

### 1. Create Database Table

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Copy the entire contents of db/migrations/create_newsletter_subscribers.sql
-- Or run it directly from the Supabase dashboard
```

**File location**: `db/migrations/create_newsletter_subscribers.sql`

### 2. Verify Newsletter Signup

After creating the table:
1. Visit https://reviewsandmarketing.com
2. Scroll to the newsletter section (above final CTA)
3. Enter a test email and click "Subscribe"
4. Check Supabase → Table Editor → `newsletter_subscribers`
5. Verify the entry appears
6. Check your test email for the welcome message

### 3. Exit-Intent Popup

- **Trigger**: Mouse moves to top of page after 5 seconds
- **Cookie**: `exit_intent_shown=true` expires after 7 days
- **Test**: Clear cookies and revisit the site to see popup again

---

## 💬 Live Chat Setup (Crisp)

### 1. Create Crisp Account
1. Go to https://crisp.chat
2. Sign up (free tier available)
3. Create a new website
4. Copy your **Website ID** (looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 2. Add Environment Variable

**In Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add new variable:
   - **Name**: `NEXT_PUBLIC_CRISP_WEBSITE_ID`
   - **Value**: Your Crisp Website ID
   - **Environment**: Production (and Preview if desired)
4. Click "Save"

### 3. Redeploy

```bash
cd /Users/mike/Documents/reviewsandmarketing
vercel --prod
```

Or trigger a redeploy from Vercel dashboard.

### 4. Verify Chat Widget

After deployment:
1. Visit https://reviewsandmarketing.com
2. Look for chat bubble in bottom-right corner
3. Click to open chat
4. If logged in, your email should auto-populate

### 5. Crisp Configuration (Optional)

In Crisp dashboard:
- Set business hours
- Configure auto-responses
- Add team members
- Customize widget color/position
- Enable mobile notifications

---

## 🔍 SEO Enhancements

### 1. Google Search Console

1. Go to https://search.google.com/search-console
2. Add property for `reviewsandmarketing.com`
3. Verify ownership using HTML tag method:
   - Copy verification meta tag
   - Add to Vercel env: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
   - Redeploy
4. Submit sitemap: `https://reviewsandmarketing.com/sitemap.xml`

### 2. Open Graph Image

Create a 1200×630px image for social sharing:

```bash
# Create the image at:
/Users/mike/Documents/reviewsandmarketing/public/og-image.png

# Design tips:
- Show dashboard preview or app screenshot
- Include logo and tagline
- Use brand colors (indigo, purple, blue)
- Keep text readable when scaled down
```

Then update `src/app/layout.tsx` if needed (already configured to look for `/og-image.png`).

### 3. Structured Data Verification

Test your structured data:
1. Go to https://search.google.com/test/rich-results
2. Enter: `https://reviewsandmarketing.com`
3. Verify SoftwareApplication schema appears
4. Check for errors/warnings

---

## 🧪 Testing Checklist

### Registration & Email Verification
- [ ] Register new account
- [ ] Receive verification email via Postmark
- [ ] Click verification link
- [ ] Redirect to dashboard after verification
- [ ] Test "Resend verification email" button

### Newsletter Signup
- [ ] Submit email via homepage form
- [ ] Check database for entry
- [ ] Receive welcome email
- [ ] Test exit-intent popup
- [ ] Verify 7-day cookie prevents re-showing

### Live Chat
- [ ] Chat widget appears
- [ ] Can send messages
- [ ] Email pre-fills when logged in
- [ ] Mobile responsive

### Settings Page
- [ ] Disabled "Save Changes" button shows gray
- [ ] Button enables after editing
- [ ] Changes persist after save
- [ ] Account deletion request sends email

### Error Handling
- [ ] Trigger 404 → shows error boundary
- [ ] Break API call → shows friendly error
- [ ] Check console for accessibility warnings (dev only)

### SEO
- [ ] Visit /sitemap.xml → shows all pages
- [ ] Visit /robots.txt → shows correct rules
- [ ] Share link on social media → correct OG image/title
- [ ] Test mobile responsiveness

---

## 🔒 Security Checklist

- [ ] All API routes use authentication
- [ ] Environment variables never exposed to client
- [ ] RLS policies enabled on all Supabase tables
- [ ] CORS configured properly
- [ ] Rate limiting enabled (if applicable)
- [ ] Session cookies use HttpOnly flag

---

## 📊 Monitoring Setup (Optional)

### Error Tracking
Consider adding Sentry:
```bash
npm install @sentry/nextjs
# Follow setup wizard
```

### Analytics
Already set up for Google Analytics in gtag events:
- Newsletter signup
- Account creation
- Button clicks

Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to enable.

---

## 🚀 Deployment Process

### Standard Deploy
```bash
cd /Users/mike/Documents/reviewsandmarketing
git add -A
git commit -m "feat: your changes"
git push origin main  # Auto-deploys via Vercel
git push randm main   # Backup to RandM repo
```

### Manual Deploy (if needed)
```bash
vercel --prod
vercel alias <deployment-url> reviewsandmarketing.com
vercel alias <deployment-url> www.reviewsandmarketing.com
```

---

## 📝 Maintenance

### Weekly
- Check email_log table for failed sends
- Review newsletter_subscribers for bounces
- Monitor Crisp chat for unanswered messages

### Monthly  
- Review Stripe subscription metrics
- Update case studies with new metrics
- Refresh testimonials if needed
- Check Google Search Console for issues

### As Needed
- Rotate API keys (Firebase, Stripe, etc.)
- Update dependencies: `npm audit fix`
- Test on new devices/browsers
- Gather user feedback

---

## 🆘 Troubleshooting

### Newsletter signup fails
1. Check Supabase table exists
2. Verify Postmark token in env vars
3. Check email_log table for errors
4. Test API directly: `curl -X POST https://reviewsandmarketing.com/api/newsletter/subscribe -H "Content-Type: application/json" -d '{"email":"test@example.com"}'`

### Crisp chat not appearing
1. Verify env var is set: `echo $NEXT_PUBLIC_CRISP_WEBSITE_ID`
2. Check browser console for errors
3. Ensure Crisp Website ID is correct format
4. Clear browser cache and hard reload

### Email verification failing
1. Check Postmark sender domain is verified
2. Verify EMAIL_FROM matches Postmark sender
3. Check email_log table for error details
4. Test API: Visit `/api/auth/email` with POST request

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Review Vercel deployment logs
3. Check Supabase logs
4. Contact support@reviewsandmarketing.com

---

**Last Updated**: October 6, 2025  
**Version**: 1.0.0
