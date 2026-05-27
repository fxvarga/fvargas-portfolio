#!/usr/bin/env python3
"""
One-time Gmail OAuth helper.
Run locally on your laptop to obtain a refresh token for Hermes Gmail access.

Prerequisites:
  1. Create a GCP project at https://console.cloud.google.com
  2. Enable Gmail API
  3. Create OAuth 2.0 Client ID (Desktop app type)
  4. Download credentials JSON

Usage:
  pip install google-auth-oauthlib
  python gmail_oauth.py --credentials /path/to/credentials.json

The script will open a browser for consent, then print the refresh token.
Store it in Azure Key Vault as 'gmail-refresh-token'.
"""

import argparse
import json

def main():
    parser = argparse.ArgumentParser(description="Obtain Gmail refresh token for Hermes")
    parser.add_argument("--credentials", required=True, help="Path to GCP OAuth credentials JSON")
    parser.add_argument("--scopes", default="https://www.googleapis.com/auth/gmail.modify,https://www.googleapis.com/auth/gmail.send",
                        help="Comma-separated OAuth scopes")
    args = parser.parse_args()

    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        print("ERROR: Install google-auth-oauthlib first:")
        print("  pip install google-auth-oauthlib")
        return

    scopes = args.scopes.split(",")
    flow = InstalledAppFlow.from_client_secrets_file(args.credentials, scopes=scopes)
    creds = flow.run_local_server(port=0)

    print("\n" + "=" * 60)
    print("SUCCESS - Store these values in Azure Key Vault:")
    print("=" * 60)
    print(f"\nRefresh Token:\n{creds.refresh_token}")
    print(f"\nClient ID:\n{creds.client_id}")
    print(f"\nClient Secret:\n{creds.client_secret}")
    print(f"\nToken URI:\n{creds.token_uri}")
    print("\nKey Vault commands:")
    print(f'  az keyvault secret set --vault-name kv-fevfevargasprodeastus --name gmail-refresh-token --value "{creds.refresh_token}"')
    print(f'  az keyvault secret set --vault-name kv-fevfevargasprodeastus --name gmail-oauth-client-id --value "{creds.client_id}"')
    print(f'  az keyvault secret set --vault-name kv-fevfevargasprodeastus --name gmail-oauth-client-secret --value "{creds.client_secret}"')

if __name__ == "__main__":
    main()
