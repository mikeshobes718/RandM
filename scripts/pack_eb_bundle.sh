#!/usr/bin/env bash
set -euo pipefail

# Clean, build Next standalone, and zip only the needed files for EB.

APP_NAME=${APP_NAME:-reviewsandmarketing}
OUT_DIR=.next
ZIP_NAME=${1:-${APP_NAME}-$(date +%Y%m%d-%H%M%S).zip}

echo "[1/3] Cleaning previous build..."
rm -rf "$OUT_DIR"

echo "[2/3] Installing dependencies and building Next.js (standalone)..."
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run build

# Ensure Next static assets are available relative to the standalone server.
# Some Next.js versions resolve distDir relative to server.js (__dirname), so
# copy .next/static under .next/standalone/.next/static to avoid 404s for
# /_next/static/* assets in production.
mkdir -p "$OUT_DIR/standalone/.next/static"
cp -R "$OUT_DIR/static" "$OUT_DIR/standalone/.next/" 2>/dev/null || true

echo "[3/3] Creating bundle: $ZIP_NAME"
rm -f "$ZIP_NAME"
# Bundle only what's needed to run standalone; exclude package.json to skip EB npm install
zip -r "$ZIP_NAME" \
  Procfile \
  .ebextensions \
  .platform \
  public \
  $OUT_DIR/standalone \
  -x "**/.DS_Store" "**/.git/**" "node_modules/**"

echo "Bundle ready: $ZIP_NAME"
