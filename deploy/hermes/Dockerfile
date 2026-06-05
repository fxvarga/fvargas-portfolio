FROM python:3.12-slim

# Install system dependencies + Docker CLI (for terminal backend via socket)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    xz-utils \
    ca-certificates \
    gnupg \
    && install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update && apt-get install -y --no-install-recommends docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI (for Copilot auth via `gh auth token`)
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (for dashboard web UI build)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Hermes Agent (pinned release)
ARG HERMES_VERSION=latest
RUN curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# Pre-build the dashboard web UI
RUN cd /usr/local/lib/hermes-agent/web && npm install && npm run build

# Install Google Workspace Python dependencies
RUN pip install --no-cache-dir google-api-python-client google-auth-httplib2 google-auth-oauthlib

# Create hermes home directory
RUN mkdir -p /root/.hermes

# Copy config and entrypoint
COPY config.yaml /root/.hermes/config.yaml
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /root

# Entrypoint generates Google credential files from env vars, then runs hermes
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["gateway"]
