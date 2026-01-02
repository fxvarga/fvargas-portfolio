#!/bin/bash

# Docker development mode - runs backend and frontend in containers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Docker environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running"
    exit 1
fi

# Build and start containers
docker compose up -d --build

echo ""
echo "Services starting:"
echo "  Frontend: http://localhost"
echo "  Backend:  http://localhost/graphql"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f     # View logs"
echo "  docker compose down        # Stop containers"
echo "  docker compose restart     # Restart containers"
echo ""

# Follow logs
docker compose logs -f
