#!/bin/bash

echo "🚀 Waiting for Vercel deployment to go live..."
echo "   Checking: https://reviewsandmarketing.com/api/businesses/upsert/form"
echo "   Looking for: business data in response"
echo ""

FIREBASE_KEY="AIzaSyAbvy5lC1yczSa8HMmicpEYFFZz0tbHZ5s"
EMAIL="kewukimu83@mexvat.com"
PASSWORD="T@st1234"

# Get Firebase token
echo "🔐 Getting authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"'"${EMAIL}"'","password":"'"${PASSWORD}"'","returnSecureToken":true}')

ID_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['idToken'])" 2>/dev/null)

if [ -z "$ID_TOKEN" ]; then
  echo "❌ Failed to get auth token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Got token: ${ID_TOKEN:0:20}..."
echo ""

MAX_ATTEMPTS=20
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "[$ATTEMPT/$MAX_ATTEMPTS] Checking deployment... ($(date +%H:%M:%S))"
  
  RESPONSE=$(curl -s -X POST "https://reviewsandmarketing.com/api/businesses/upsert/form" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ID_TOKEN}" \
    -d "{\"name\":\"Test Deploy Check $(date +%s)\",\"idToken\":\"${ID_TOKEN}\"}")
  
  echo "   Response: $RESPONSE"
  
  # Check if response contains "business" key
  if echo "$RESPONSE" | grep -q '"business"'; then
    echo ""
    echo "✅✅✅ DEPLOYMENT IS LIVE! ✅✅✅"
    echo ""
    echo "The API now returns business data:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "✅ You can now test the complete flow on the site!"
    exit 0
  fi
  
  if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
    echo "   ⏳ Still old code. Waiting 30 seconds..."
    echo ""
    sleep 30
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
done

echo ""
echo "⚠️  Deployment not detected after $MAX_ATTEMPTS attempts (10 minutes)"
echo "   Last response: $RESPONSE"
echo ""
echo "The code is pushed to GitHub. Vercel should pick it up automatically."
echo "You can continue working - it will deploy in the background."
