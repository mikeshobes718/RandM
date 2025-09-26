#!/usr/bin/env bash
set -euo pipefail

# Adds common Postmark DNS records to Vercel DNS for a given domain.
# Usage: DOMAIN=reviewsandmarketing.com POSTMARK_ACCOUNT_TOKEN=... bash scripts/vercel_dns_postmark.sh

DOMAIN=${DOMAIN:-}
POSTMARK_ACCOUNT_TOKEN=${POSTMARK_ACCOUNT_TOKEN:-}

if [ -z "$DOMAIN" ] || [ -z "$POSTMARK_ACCOUNT_TOKEN" ]; then
  echo "Usage: DOMAIN=example.com POSTMARK_ACCOUNT_TOKEN=... $0" >&2
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "[vercel] Vercel CLI not found. Install with: npm i -g vercel" >&2
  exit 2
fi

echo "[postmark] Fetching domain ID for $DOMAIN…"
DOMAIN_ID=$(curl -fsSL https://api.postmarkapp.com/domains -H "X-Postmark-Account-Token: $POSTMARK_ACCOUNT_TOKEN" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);const m=j.Domains.find(x=>x.Name==='${DOMAIN}'); if(!m){process.exit(9)}; console.log(m.ID)})") || {
  echo "[postmark] Domain not found in Postmark. Create it in Postmark first." >&2
  exit 3
}

DETAILS=$(curl -fsSL https://api.postmarkapp.com/domains/$DOMAIN_ID -H "X-Postmark-Account-Token: $POSTMARK_ACCOUNT_TOKEN")
DKIM_NAME=$(echo "$DETAILS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log(j.DKIMPendingHost)})")
DKIM_VALUE=$(echo "$DETAILS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log(j.DKIMTextValue)})")
RETURN_PATH=$(echo "$DETAILS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log(j.ReturnPathDomain)})")

echo "[dns] Adding DKIM TXT ${DKIM_NAME}…"
vercel dns add "$DOMAIN" "$DKIM_NAME" TXT "$DKIM_VALUE" || true

echo "[dns] Adding Return-Path CNAME pm-bounces → pm.mtasv.net…"
vercel dns add "$DOMAIN" pm-bounces CNAME pm.mtasv.net || true

echo "[dns] Adding SPF TXT…"
vercel dns add "$DOMAIN" @ TXT "v=spf1 include:spf.mtasv.net ~all" || true

echo "[postmark] DNS records added to Vercel DNS (ensure domain uses Vercel nameservers)."

