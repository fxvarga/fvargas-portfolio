#!/bin/bash

# Native development mode - runs backend and frontend directly

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting native development environment..."

# Run backend
echo "Starting backend (.NET)..."
cd "$SCRIPT_DIR/backend/dotnet"
dotnet run --project FV.Api &
BACKEND_PID=$!

# Run frontend
echo "Starting frontend (React)..."
cd "$SCRIPT_DIR/frontend/portfolio-react"
pnpm start &
FRONTEND_PID=$!

# Handle cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "Services starting:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000/graphql"
echo ""
echo "Press Ctrl+C to stop"

# Wait for both
wait