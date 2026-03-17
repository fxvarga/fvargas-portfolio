#!/bin/sh
# Debug the proposal generator workflow from inside the n8n container

# Step 1: Login to get session cookie
echo "=== LOGGING IN ==="
LOGIN_RESP=$(wget -qO- --no-check-certificate \
  --header="Content-Type: application/json" \
  --post-data='{"emailOrLdapLoginId":"fxvarga@gmail.com","password":"KUrrego123456"}' \
  --save-cookies /tmp/n8n_cookies.txt \
  "https://localhost:5678/rest/login" 2>&1)
echo "Login done"

# Step 2: Get the workflow
echo ""
echo "=== GETTING WORKFLOW ==="
WF=$(wget -qO- --no-check-certificate \
  --load-cookies /tmp/n8n_cookies.txt \
  "https://localhost:5678/rest/workflows/catering-proposal-gen" 2>&1)

# Save full output
echo "$WF" > /tmp/wf_dump.json

# Parse key fields with basic tools
echo "Node count: $(echo "$WF" | grep -o '"id":"node-' | wc -l)"
echo ""
echo "=== NODE IDS ==="
echo "$WF" | grep -oP '"id":"node-[^"]*"' | head -20
echo ""
echo "=== CONNECTIONS KEYS ==="
echo "$WF" | grep -oP '"[A-Z][^"]*":{"main"' | head -20

# Step 3: Fire webhook test
echo ""
echo "=== FIRING TEST WEBHOOK ==="
WEBHOOK_RESP=$(wget -qO- --no-check-certificate \
  --header="Content-Type: application/json" \
  --post-data='{"firstName":"Test","lastName":"Debug","email":"test@debug.com","phone":"555-0000","company":"Debug Corp","eventDate":"2026-06-01","guestCount":"50","budget":"5000","menuTier":"Standard"}' \
  "http://localhost:5678/webhook/generate-proposal" 2>&1)
echo "Webhook response: $WEBHOOK_RESP"

echo ""
echo "=== DONE ==="
