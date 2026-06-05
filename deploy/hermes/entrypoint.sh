#!/bin/bash
set -e

HERMES_DIR="/root/.hermes"

# Generate google_client_secret.json from env vars if available
if [ -n "$GMAIL_OAUTH_CLIENT_ID" ] && [ -n "$GMAIL_OAUTH_CLIENT_SECRET" ]; then
  cat > "$HERMES_DIR/google_client_secret.json" <<EOF
{
  "installed": {
    "client_id": "$GMAIL_OAUTH_CLIENT_ID",
    "project_id": "hermesassistant-497901",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "$GMAIL_OAUTH_CLIENT_SECRET",
    "redirect_uris": ["http://localhost"]
  }
}
EOF
  echo "Generated google_client_secret.json"
fi

# Generate google_token.json from env vars if available
if [ -n "$GMAIL_REFRESH_TOKEN" ] && [ -n "$GMAIL_OAUTH_CLIENT_ID" ] && [ -n "$GMAIL_OAUTH_CLIENT_SECRET" ]; then
  cat > "$HERMES_DIR/google_token.json" <<EOF
{
  "token": "",
  "refresh_token": "$GMAIL_REFRESH_TOKEN",
  "token_uri": "https://oauth2.googleapis.com/token",
  "client_id": "$GMAIL_OAUTH_CLIENT_ID",
  "client_secret": "$GMAIL_OAUTH_CLIENT_SECRET",
  "scopes": [
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/spreadsheets"
  ]
}
EOF
  echo "Generated google_token.json"
fi

# Execute the main command
exec hermes "$@"
