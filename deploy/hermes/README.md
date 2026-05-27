# Hermes Agent - Operator Runbook

Personal AI assistant deployed on Azure VM via Docker Compose.

## Architecture

- **Model**: GitHub Copilot Enterprise (github.com SaaS) via `gh auth token`
- **Messaging**: Telegram (long-poll, no inbound port)
- **Mail**: Gmail (OAuth, requires manual token setup)
- **Sandboxing**: Docker terminal backend (docker.sock mount)
- **Admin**: Local only, access via Twingate SSH

## Bootstrap (one-time setup)

### 1. Create Telegram Bot

1. Message @BotFather on Telegram
2. `/newbot` -> name it whatever you want
3. Save the token
4. Get your numeric Telegram user ID from @userinfobot

### 2. GitHub CLI Auth (on VM)

```bash
# SSH into VM via Twingate
ssh azureuser@10.20.1.4

# Auth gh CLI with your Copilot Enterprise account
docker exec -it portfolio-hermes gh auth login
# Choose: GitHub.com -> HTTPS -> Login with a web browser
# Complete the device code flow

# Verify
docker exec portfolio-hermes gh auth status
```

### 3. Gmail OAuth (on your laptop)

```bash
cd deploy/hermes/scripts
pip install google-auth-oauthlib
python gmail_oauth.py --credentials /path/to/your-gcp-credentials.json
```

Store the output values as GitHub Secrets (or skip; Gmail will fail gracefully).

### 4. Set GitHub Secrets

Required for Telegram to work:
- `TELEGRAM_BOT_TOKEN` - from BotFather
- `TELEGRAM_ALLOWED_USERS` - your numeric Telegram user ID
- `GATEWAY_ALLOWED_USERS` - same

Optional for Gmail:
- `GMAIL_OAUTH_CLIENT_ID`
- `GMAIL_OAUTH_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`

### 5. Deploy

Push to main or trigger workflow_dispatch. The hermes container will start.

### 6. Pair your Telegram account

1. DM the bot on Telegram - it will reply with a pairing code
2. On the VM:
```bash
docker exec portfolio-hermes hermes pairing approve telegram <code>
```

## Operations

### View logs
```bash
docker logs portfolio-hermes -f --tail 100
```

### Re-authenticate GitHub (if token expires)
```bash
docker exec -it portfolio-hermes gh auth login
```

### Restart hermes
```bash
docker restart portfolio-hermes
```

### Check sandbox containers
```bash
docker ps --filter "name=hermes-sandbox"
```

## Safety

- `approval.mode: smart` - dangerous commands require your approval via Telegram DM
- Hardline blocklist blocks `rm -rf /`, fork bombs, `mkfs`, `dd`, `curl|sh` unconditionally
- Sandbox containers: `cap-drop ALL`, `no-new-privileges`, 256 pids, 512MB RAM, 5min timeout
- Gmail sends require explicit approval in Telegram before sending
- DM pairing: 8-char codes, 1hr TTL, 5-fail lockout
