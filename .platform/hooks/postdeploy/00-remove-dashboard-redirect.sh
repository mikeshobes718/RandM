#!/bin/bash
set -e
CONF="/etc/nginx/conf.d/elasticbeanstalk/99-dashboard-redirect.conf"
if [ -f "$CONF" ]; then
  rm -f "$CONF"
  if command -v systemctl >/dev/null 2>&1; then
    systemctl reload nginx || true
  else
    service nginx reload || true
  fi
fi
