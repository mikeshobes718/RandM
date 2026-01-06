#!/bin/bash

# Bulk import script - runs in batches to avoid timeouts
# Usage: ./scripts/run-bulk-import.sh

ADMIN_TOKEN="rm_admin_pass_2026"
BASE_URL="https://www.reviewsandmarketing.com"

echo "🚀 Starting bulk import in batches..."
echo ""

# Batch 1: NY, CA (2 cities each, 5 categories each)
echo "📦 Batch 1: NY, CA (2 cities each)..."
curl -X POST "${BASE_URL}/api/admin/bulk-import-leads?token=${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"limitCities": 2, "limitCategories": 10}' \
  --max-time 600

echo ""
echo "✅ Batch 1 complete. Waiting 10 seconds before next batch..."
sleep 10

# Batch 2: TX, FL
echo "📦 Batch 2: TX, FL (2 cities each)..."
curl -X POST "${BASE_URL}/api/admin/bulk-import-leads?token=${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"limitCities": 2, "limitCategories": 10, "startState": "TX"}' \
  --max-time 600

echo ""
echo "✅ Batch 2 complete. Check logs for results."
echo ""
echo "💡 Tip: Run this script multiple times with different batch configurations"
echo "   to gradually build up your leads database without hitting timeouts."

