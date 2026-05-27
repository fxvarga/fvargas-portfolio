#!/bin/bash
# Recreate the Twingate connector on the Azure VM.
# Use this if the VM is rebuilt or the container is lost.
#
# Prerequisites:
#   - SSH access to the VM (via Twingate client or during initial setup)
#   - Twingate connector tokens (from https://fxvarga.twingate.com/connectors)
#
# Usage:
#   ssh azureuser@10.20.1.4  # or via public IP during initial setup
#   bash /opt/portfolio/setup-twingate-connector.sh

set -euo pipefail

TWINGATE_NETWORK="${TWINGATE_NETWORK:?Set TWINGATE_NETWORK env var}"
TWINGATE_ACCESS_TOKEN="${TWINGATE_ACCESS_TOKEN:?Set TWINGATE_ACCESS_TOKEN env var}"
TWINGATE_REFRESH_TOKEN="${TWINGATE_REFRESH_TOKEN:?Set TWINGATE_REFRESH_TOKEN env var}"

echo "Removing old connector (if any)..."
docker rm -f twingate-connector 2>/dev/null || true

echo "Starting twingate-connector..."
docker run -d \
  --name twingate-connector \
  --restart unless-stopped \
  --network host \
  -e TWINGATE_NETWORK="$TWINGATE_NETWORK" \
  -e TWINGATE_ACCESS_TOKEN="$TWINGATE_ACCESS_TOKEN" \
  -e TWINGATE_REFRESH_TOKEN="$TWINGATE_REFRESH_TOKEN" \
  -e TWINGATE_LABEL_HOSTNAME=vm-fev-prod \
  twingate/connector:1

echo "Waiting 10s for connector to initialize..."
sleep 10

if docker inspect --format='{{.State.Running}}' twingate-connector 2>/dev/null | grep -q true; then
  echo "OK: twingate-connector is running"
else
  echo "ERROR: twingate-connector failed to start"
  docker logs twingate-connector
  exit 1
fi
