#!/bin/bash

# Bulk import script - runs in batches to avoid timeouts
# Usage: ./scripts/run-bulk-import.sh

ADMIN_TOKEN="rm_admin_pass_2026"
BASE_URL="https://www.reviewsandmarketing.com"

echo "🚀 Starting bulk import in batches..."
echo ""

# Batch 1: Top 3 states, 5 categories, 3 cities each
echo "📦 Batch 1: NY, CA, TX (3 cities, 5 categories each)..."
curl -X POST "${BASE_URL}/api/admin/bulk-import-leads?token=${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"limitCities": 3, "limitCategories": 5}' \
  --max-time 600

echo ""
echo "✅ Batch 1 complete. Waiting 10 seconds before next batch..."
sleep 10

# Batch 2: Next 3 states
echo "📦 Batch 2: FL, IL, GA (3 cities, 5 categories each)..."
curl -X POST "${BASE_URL}/api/admin/bulk-import-leads?token=${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"limitCities": 3, "limitCategories": 5, "startState": "FL"}' \
  --max-time 600

echo ""
echo "✅ Batch 2 complete. Check logs for results."
echo ""
echo "💡 Tip: Run this script multiple times with different batch configurations"
echo "   to gradually build up your leads database without hitting timeouts."

