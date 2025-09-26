#!/usr/bin/env bash
set -euo pipefail
DOMAIN=${1:-reviewsandmarketing.com}
VERCEL_FALLBACK_URL=${VERCEL_FALLBACK_URL:-https://reviewsandmarketing-dsw78d583-mikes-projects-9cbe43e2.vercel.app}

check_dns(){
  dig +short "$DOMAIN" A | grep -E '^76\.76\.21\.21$' >/dev/null 2>&1
}

check_health(){
  curl -fsS -m 10 "https://$DOMAIN/api/healthz" >/dev/null 2>&1
}

until check_dns; do
  echo "[wait] DNS for $DOMAIN not on Vercel yet (A != 76.76.21.21). Sleeping 30s…";
  sleep 30;
  done

echo "[ok] DNS A for $DOMAIN points to 76.76.21.21. Waiting for health 200…"

for i in {1..60}; do
  if check_health; then echo "[ok] Health 200 at https://$DOMAIN/api/healthz"; break; fi
  echo "[wait] Health not ready yet; retry $i/60"; sleep 10
done

if ! check_health; then
  echo "[warn] Health still not ready. Showing fallback url health:";
  curl -sS "$VERCEL_FALLBACK_URL/api/healthz" || true
  exit 1
fi

APP_URL="https://$DOMAIN" node scripts/smoke_puppeteer.mjs
