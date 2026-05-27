FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI (for Copilot auth via `gh auth token`)
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Install Hermes Agent (pinned release)
ARG HERMES_VERSION=latest
RUN curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# Create hermes home directory
RUN mkdir -p /root/.hermes

# Copy config
COPY config.yaml /root/.hermes/config.yaml

WORKDIR /root

# Default entrypoint runs hermes with the messaging gateway
ENTRYPOINT ["hermes"]
CMD ["gateway"]
