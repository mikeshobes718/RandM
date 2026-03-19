#!/usr/bin/env bash
set -euo pipefail

AWS_REGION=${AWS_REGION:-us-east-1}
EB_APP_NAME=${EB_APP_NAME:-"Reviews and Marketing"}
EB_ENV_NAME=${EB_ENV_NAME:-reviewsandmarketing-prod}
ROOT_DOMAIN=${ROOT_DOMAIN:-reviewsandmarketing.com}
WWW_DOMAIN=${WWW_DOMAIN:-www.reviewsandmarketing.com}

echo "Region: $AWS_REGION"

CERT_ARN=$(aws acm request-certificate \
  --region "$AWS_REGION" \
  --domain-name "$ROOT_DOMAIN" \
  --subject-alternative-names "$WWW_DOMAIN" \
  --validation-method DNS \
  --idempotency-token ram-acm-001 \
  --options CertificateTransparencyLoggingPreference=ENABLED \
  --query CertificateArn --output text || true)
echo "CERT_ARN=$CERT_ARN"

HZ_ID=$(aws route53 list-hosted-zones-by-name --dns-name "$ROOT_DOMAIN" --query 'HostedZones[0].Id' --output text || true)
if [[ "$HZ_ID" != "None" && -n "$HZ_ID" ]]; then
  aws acm describe-certificate --certificate-arn "$CERT_ARN" --region "$AWS_REGION" \
   | jq -r '.Certificate.DomainValidationOptions[].ResourceRecord' > /tmp/dv.json

  cat >/tmp/rr.json <<JSON
{
  "Comment": "ACM validation for $ROOT_DOMAIN",
  "Changes": [
    $(jq -r '
      to_entries | map(
        {
          "Action":"UPSERT",
          "ResourceRecordSet":{
            "Name": .value.Name,
            "Type": .value.Type,
            "TTL": 300,
            "ResourceRecords":[{"Value": .value.Value}]
          }
        }
      ) | join(",")
    ' /tmp/dv.json)
  ]
}
JSON
  aws route53 change-resource-record-sets --hosted-zone-id "$HZ_ID" --change-batch file:///tmp/rr.json
fi

LB_NAME=$(aws elasticbeanstalk describe-environment-resources --environment-name "$EB_ENV_NAME" \
  --query 'EnvironmentResources.LoadBalancers[0].Name' --output text)
LB_JSON=$(aws elbv2 describe-load-balancers --names "$LB_NAME")
LB_ARN=$(echo "$LB_JSON" | jq -r '.LoadBalancers[0].LoadBalancerArn')
LB_ZONE_ID=$(echo "$LB_JSON" | jq -r '.LoadBalancers[0].CanonicalHostedZoneId')
LB_DNS=$(echo "$LB_JSON" | jq -r '.LoadBalancers[0].DNSName')

TG_ARN=$(aws elbv2 describe-target-groups --load-balancer-arn "$LB_ARN" \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

HTTPS_ARN=$(aws elbv2 describe-listeners --load-balancer-arn "$LB_ARN" \
  --query 'Listeners[?Port==`443`].ListenerArn' --output text || true)
if [[ -z "$HTTPS_ARN" || "$HTTPS_ARN" == "None" ]]; then
  aws elbv2 create-listener --load-balancer-arn "$LB_ARN" \
    --protocol HTTPS --port 443 \
    --certificates CertificateArn="$CERT_ARN" \
    --ssl-policy ELBSecurityPolicy-2016-08 \
    --default-actions Type=forward,TargetGroupArn="$TG_ARN"
else
  aws elbv2 modify-listener --listener-arn "$HTTPS_ARN" \
    --certificates CertificateArn="$CERT_ARN"
fi

HTTP_ARN=$(aws elbv2 describe-listeners --load-balancer-arn "$LB_ARN" \
  --query 'Listeners[?Port==`80`].ListenerArn' --output text)
aws elbv2 modify-listener --listener-arn "$HTTP_ARN" \
  --default-actions Type=redirect,RedirectConfig='{"Protocol":"HTTPS","Port":"443","StatusCode":"HTTP_301"}'

if [[ "$HZ_ID" != "None" && -n "$HZ_ID" ]]; then
  cat > /tmp/alias.json <<JSON
{
  "Comment": "Alias apex to ALB and www->apex",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$ROOT_DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "$LB_ZONE_ID",
          "DNSName": "dualstack.$LB_DNS",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$WWW_DOMAIN",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "$ROOT_DOMAIN"}]
      }
    }
  ]
}
JSON
  aws route53 change-resource-record-sets --hosted-zone-id "$HZ_ID" --change-batch file:///tmp/alias.json
fi

echo "Done. ALB: $LB_DNS"


