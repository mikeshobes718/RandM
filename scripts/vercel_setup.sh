#!/usr/bin/env bash
set -euo pipefail

# One-shot helper to deploy this Next.js app to Vercel with your real domain.
# It will:
#  - Ensure Vercel CLI is installed and project is linked
#  - Import env vars from .env.local (overridable)
#  - Deploy to production
#  - Attach your domain in Vercel
#  - Print DNS steps (nameserver change or A/CNAME alternative)

PROJECT_SLUG=${PROJECT_SLUG:-reviewsandmarketing}
DOMAIN=${DOMAIN:-reviewsandmarketing.com}
WWW_DOMAIN="www.${DOMAIN}"

need_cli() {
  if ! command -v vercel >/dev/null 2>&1; then
    echo "[vercel] Vercel CLI not found. Install with: npm i -g vercel" >&2
    exit 2
  fi
}

need_login() {
  if ! vercel whoami >/dev/null 2>&1; then
    echo "[vercel] Not logged in. Run: vercel login" >&2
    exit 3
  fi
}

link_project() {
  echo "[vercel] Linking project (slug=$PROJECT_SLUG)…"
  vercel link --yes --project "$PROJECT_SLUG" >/dev/null || true
}

push_env() {
  local DOTENV=".env.local"
  if [ ! -f "$DOTENV" ]; then
    echo "[env] $DOTENV not found; skipping automatic env import." >&2
    return 0
  fi

  echo "[env] Importing selected keys from $DOTENV → Vercel (production)…"
  # Keys we expect server-side
  local KEYS=(
    APP_URL
    STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY STRIPE_PRICE_ID STRIPE_YEARLY_PRICE_ID STRIPE_WEBHOOK_SECRET
    POSTMARK_SERVER_TOKEN EMAIL_FROM
    GOOGLE_MAPS_API_KEY
    SQUARE_APPLICATION_ID SQUARE_APPLICATION_SECRET
    SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY
    SUPABASE_DB_PASSWORD SUPABASE_DB_HOST SUPABASE_DB_PORT SUPABASE_DB_USER SUPABASE_DB_NAME
    FIREBASE_SERVICE_ACCOUNT_B64
    FIREBASE_PROJECT_ID FIREBASE_PRIVATE_KEY_ID FIREBASE_PRIVATE_KEY FIREBASE_CLIENT_EMAIL FIREBASE_CLIENT_ID FIREBASE_AUTH_URI FIREBASE_TOKEN_URI FIREBASE_AUTH_PROVIDER_X509_CERT_URL FIREBASE_CLIENT_X509_CERT_URL FIREBASE_UNIVERSE_DOMAIN
  )
  # Public keys
  local PKEYS=(
    NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN NEXT_PUBLIC_FIREBASE_PROJECT_ID NEXT_PUBLIC_FIREBASE_APP_ID NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    NEXT_PUBLIC_ADMIN_EMAILS NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  )

  # Ensure APP_URL points to apex domain in production
  local TMP_ENV=$(mktemp)
  # Normalize CRLF and strip comments, keep non-empty KEY=VALUE lines.
  tr -d '\r' < "$DOTENV" | grep -E '^[A-Za-z0-9_]+=' | grep -v -E '^\s*#' > "$TMP_ENV"
  if grep -q '^APP_URL=' "$TMP_ENV"; then
    sed -i '' "s#^APP_URL=.*#APP_URL=https://$DOMAIN#g" "$TMP_ENV" 2>/dev/null || sed -i "s#^APP_URL=.*#APP_URL=https://$DOMAIN#g" "$TMP_ENV"
  else
    echo "APP_URL=https://$DOMAIN" >> "$TMP_ENV"
  fi

  # Helper to add key if present in tmp
  add_key(){
    local K=$1
    local V=$(grep -E "^${K}=" "$TMP_ENV" | sed -E "s/^${K}=//")
    if [ -n "${V:-}" ]; then
      # Remove existing value if present, then add new
      vercel env rm "$K" production --yes >/dev/null 2>&1 || true
      printf "%s" "$V" | vercel env add "$K" production >/dev/null
      echo "  + $K"
    fi
  }

  for k in "${KEYS[@]}"; do add_key "$k"; done
  for k in "${PKEYS[@]}"; do add_key "$k"; done
  rm -f "$TMP_ENV"
}

deploy_prod() {
  echo "[vercel] Deploying to production…"
  vercel deploy --prod --yes > .vercel-last-deploy.txt
  local URL=$(tail -n1 .vercel-last-deploy.txt | tr -d '\n')
  echo "[vercel] Production URL: $URL"
}

attach_domain() {
  echo "[vercel] Attaching domain(s)…"
  vercel domains add "$DOMAIN" --yes >/dev/null 2>&1 || true
  vercel domains add "$WWW_DOMAIN" --yes >/dev/null 2>&1 || true

  echo "[vercel] Inspecting domain to retrieve nameservers…"
  vercel domains inspect "$DOMAIN" > .vercel-domain-inspect.txt || true
  echo "[dns] Review nameservers below — update at your registrar:"
  grep -A3 -E '^\s*Nameservers' .vercel-domain-inspect.txt || true

  echo "[dns] If you prefer to keep your current DNS (and can edit records), set:"
  echo "  Apex A: $DOMAIN → 76.76.21.21"
  echo "  WWW  CNAME: $WWW_DOMAIN → cname.vercel-dns.com"
}

health_check() {
  echo "[health] Once DNS points to Vercel, verify:"
  echo "  curl -sS https://$DOMAIN/api/healthz"
}

main() {
  need_cli
  need_login
  link_project
  push_env
  deploy_prod
  attach_domain
  health_check
  echo "[done] Vercel deploy complete. Update nameservers or DNS records, then run the health check."
}

main "$@"
