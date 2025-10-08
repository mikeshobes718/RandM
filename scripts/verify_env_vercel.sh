#!/bin/bash
# Script to verify environment variables are set correctly on Vercel
# Usage: ./scripts/verify_env_vercel.sh

set -e

echo "🔍 Checking Vercel environment variables..."
echo ""
echo "This script will help you verify that all required environment variables"
echo "are set correctly in your Vercel project."
echo ""

REQUIRED_VARS=(
  "APP_URL"
  "STRIPE_SECRET_KEY"
  "STRIPE_PUBLISHABLE_KEY"
  "STRIPE_PRICE_ID"
  "STRIPE_WEBHOOK_SECRET"
  "POSTMARK_SERVER_TOKEN"
  "EMAIL_FROM"
  "GOOGLE_MAPS_API_KEY"
  "SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
  "FIREBASE_SERVICE_ACCOUNT_B64"
)

OPTIONAL_VARS=(
  "STRIPE_YEARLY_PRICE_ID"
  "NEXT_PUBLIC_FIREBASE_API_KEY"
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  "NEXT_PUBLIC_FIREBASE_APP_ID"
  "NEXT_PUBLIC_ADMIN_EMAILS"
  "ADMIN_TOKEN"
)

echo "📋 Required environment variables:"
echo ""
for var in "${REQUIRED_VARS[@]}"; do
  echo "  ✓ $var"
done

echo ""
echo "📋 Optional environment variables:"
echo ""
for var in "${OPTIONAL_VARS[@]}"; do
  echo "  ○ $var"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: Email Configuration"
echo ""
echo "  EMAIL_FROM must be set to: subscriptions@reviewsandmarketing.com"
echo ""
echo "  This domain/email must be verified in your Postmark account."
echo "  If not verified, emails will fail to send."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📝 To set environment variables in Vercel:"
echo ""
echo "  1. Go to https://vercel.com/dashboard"
echo "  2. Select your project (reviewsandmarketing)"
echo "  3. Go to Settings → Environment Variables"
echo "  4. Add/update each variable for Production, Preview, and Development"
echo ""
echo "  Or use the Vercel CLI:"
echo ""
echo "    vercel env add EMAIL_FROM production"
echo "    # Then paste: subscriptions@reviewsandmarketing.com"
echo ""
echo "    vercel env add POSTMARK_SERVER_TOKEN production"
echo "    # Then paste: ${POSTMARK_SERVER_TOKEN}"
echo ""

echo ""
echo "🚀 After updating environment variables, redeploy:"
echo ""
echo "    vercel --prod"
echo ""
echo "  Or trigger a redeploy from the Vercel dashboard:"
echo "    Deployments → [Latest] → ⋯ → Redeploy"
echo ""

echo "✅ Done! Make sure to redeploy after updating environment variables."
echo ""
