#!/usr/bin/env bash
# get-azure-ai-costs.sh
# Queries Azure Cost Management for AI-related resource groups and prints totals.
# Usage: bash scripts/get-azure-ai-costs.sh [days]   (default: 30)

set -uo pipefail

# Detect a working python interpreter (python3 on Windows may be a Store stub)
PYTHON=""
for candidate in python3 python; do
  if command -v "$candidate" &>/dev/null && "$candidate" -c "print('ok')" &>/dev/null; then
    PYTHON="$candidate"
    break
  fi
done
if [ -z "$PYTHON" ]; then
  echo "ERROR: python or python3 is required but not found." >&2
  exit 1
fi

DAYS="${1:-30}"
SUBSCRIPTION_ID=$(az account show --query "id" -o tsv | tr -d '\r')
TODAY=$(date -u +"%Y-%m-%dT00:00:00Z")
START=$(date -u -d "-${DAYS} days" +"%Y-%m-%dT00:00:00Z" 2>/dev/null || date -u -v-"${DAYS}"d +"%Y-%m-%dT00:00:00Z")

echo "=============================================="
echo " Azure AI Cost Report"
echo " Subscription: $(az account show --query 'name' -o tsv | tr -d '\r')"
echo " Period: last ${DAYS} days"
echo " From: ${START}"
echo " To:   ${TODAY}"
echo "=============================================="
echo ""

# Discover AI-related resource groups (tr -d '\r' strips Windows carriage returns)
RG_LIST=$(az group list --query "[?contains(name,'ai') || contains(name,'AI') || contains(name,'openai') || contains(name,'foundry')].name" -o tsv | tr -d '\r')

if [ -z "$RG_LIST" ]; then
  echo "No AI-related resource groups found."
  exit 0
fi

GRAND_TOTAL=0

# Write query body to a temp file as single-line JSON
TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT

printf '{"type":"ActualCost","timeframe":"Custom","timePeriod":{"from":"%s","to":"%s"},"dataset":{"granularity":"None","aggregation":{"totalCost":{"name":"Cost","function":"Sum"}},"grouping":[{"type":"Dimension","name":"Meter"}]}}' \
  "$START" "$TODAY" > "$TMPFILE"

for RG in $RG_LIST; do
  echo "----------------------------------------------"
  echo " Resource Group: ${RG}"
  echo "----------------------------------------------"

  RESULT=""
  if RESULT=$(az rest --method post \
    --url "https://management.azure.com/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RG}/providers/Microsoft.CostManagement/query?api-version=2023-11-01" \
    --headers "Content-Type=application/json" \
    --body @"${TMPFILE}" 2>&1); then
    RESULT=$(echo "$RESULT" | tr -d '\r')
  else
    echo "  [ERROR] Failed to query costs for ${RG}"
    echo ""
    continue
  fi

  ROW_COUNT=$(echo "$RESULT" | "$PYTHON" -c "import sys,json; d=json.load(sys.stdin); print(len(d['properties']['rows']))" 2>/dev/null || echo "0")

  if [ "$ROW_COUNT" = "0" ]; then
    echo "  No costs recorded in this period."
    echo ""
    continue
  fi

  # Print meter breakdown and calculate RG total
  RG_OUTPUT=$(echo "$RESULT" | "$PYTHON" -c "
import sys, json
data = json.load(sys.stdin)
rows = data['properties']['rows']
rows.sort(key=lambda r: r[0], reverse=True)
total = 0
hdr = 'Meter'
cost_hdr = 'Cost (USD)'
print(f'  {hdr:<45} {cost_hdr:>12}')
print(f'  {chr(45)*45} {chr(45)*12}')
for row in rows:
    cost, meter, currency = row[0], row[1], row[2]
    total += cost
    if cost >= 0.001:
        print(f'  {meter:<45} \${cost:>11.4f}')
    elif cost > 0:
        print(f'  {meter:<45} \${cost:>11.6f}')
sub = 'SUBTOTAL'
print(f'  {chr(45)*45} {chr(45)*12}')
print(f'  {sub:<45} \${total:>11.4f}')
print(f'__TOTAL__={total}')
")

  # Extract numeric total from the marker line
  SUBTOTAL=$(echo "$RG_OUTPUT" | grep '^__TOTAL__=' | cut -d= -f2)
  # Print everything except the marker line
  echo "$RG_OUTPUT" | grep -v '^__TOTAL__='

  if [ -n "$SUBTOTAL" ]; then
    GRAND_TOTAL=$("$PYTHON" -c "print(${GRAND_TOTAL} + ${SUBTOTAL})")
  fi
  echo ""
done

echo "=============================================="
printf " GRAND TOTAL (all AI RGs): \$%.4f USD\n" "$GRAND_TOTAL"
echo "=============================================="
