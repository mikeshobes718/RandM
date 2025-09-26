#!/usr/bin/env bash
set -euo pipefail

# Fetches EB tail logs (nginx, node, web.stdout) for a given environment.
# Usage: scripts/eb_tail_logs.sh <environment-name>

ENV_NAME=${1:-}
REGION=${AWS_REGION:-us-east-1}

if [ -z "$ENV_NAME" ]; then
  echo "Usage: $0 <environment-name>" >&2
  exit 1
fi

echo "[logs] Requesting tail logs for $ENV_NAME…"
aws elasticbeanstalk request-environment-info --environment-name "$ENV_NAME" --info-type tail --region "$REGION" >/dev/null

echo "[logs] Waiting 10s for logs to be prepared…"
sleep 10

echo "[logs] Retrieving presigned URL…"
URL=$(aws elasticbeanstalk retrieve-environment-info --environment-name "$ENV_NAME" --info-type tail --region "$REGION" --query 'EnvironmentInfo[0].Message' --output text)

if [ -z "$URL" ] || [ "$URL" = "None" ]; then
  echo "[logs] No URL returned. Try again in a few seconds." >&2
  exit 2
fi

OUT="eb-logs-${ENV_NAME}-$(date +%Y%m%d-%H%M%S).zip"
echo "[logs] Downloading to $OUT…"
curl -fsSL "$URL" -o "$OUT"

echo "[logs] Unzipping…"
DIR="${OUT%.zip}"
mkdir -p "$DIR"
unzip -q "$OUT" -d "$DIR"

echo "[logs] Done. Explore: $DIR"

