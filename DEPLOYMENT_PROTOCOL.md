# Deployment Protocol: Pushing to Live (Vercel/GitHub)

## 1. The Branching Strategy
- **dev branch**: All active development happens here.
- **main branch**: This is the Production branch. Pushing to `main` triggers an automatic build and deployment on Vercel for reviewsandmarketing.com.

## 2. The Safe Push Workflow
Before pushing to live, always follow this 3-step sequence to avoid breaking the production site:

1. **Local Build Check**: Run `npm run build` locally. If this fails, Vercel will fail. Fix all TypeScript or "missing import" errors before committing.
2. **Commit to dev first**:
   ```bash
   git checkout dev
   git add .
   git commit -m "feat/fix: descriptive message"
   git push origin dev
   ```
3. **Merge to main for Production**:
   ```bash
   git checkout main
   git pull origin main
   git merge dev -m "Merge dev: [summary of changes]"
   git push origin main
   ```

## 3. Post-Deployment Verification
- **Vercel Dashboard**: Monitor the build at [vercel.com](https://vercel.com). Ensure the status turns green (Ready).
- **Schema Check**: If you added new database columns in `db/*.sql`, you must manually run that SQL in the Supabase SQL Editor for the production project immediately after the Vercel build finishes (until the Supabase CLI automation is finished).
- **Live Smoke Test**: Open [reviewsandmarketing.com](https://reviewsandmarketing.com) on a mobile device and verify the specific area you changed (e.g., the Contacts outreach modal).

## 4. Critical Safety Rules
- **No Force Pushing**: Never `git push --force` to `main`.
- **Secret Safety**: Never commit `.env`, `.env.local`, or `service-account.json`. All production secrets must be managed in the Vercel Project Settings → Environment Variables.
- **GUI Preservation**: This is a final product. Do not change colors, spacing, or branding without explicit user approval.

---
*Summary for learning: This "Merge-to-Main" workflow ensures that only "known-good" code reaches the live site by using `dev` as a staging area and verifying builds locally first. This prevents the "it worked on my machine but crashed in prod" scenario.*
