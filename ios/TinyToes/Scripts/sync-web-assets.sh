#!/bin/bash
# Syncs the PWA build output into the iOS app bundle directory.
# Usage: ./Scripts/sync-web-assets.sh [path-to-dist]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PROJECT_ROOT/../.." && pwd)"

DIST_DIR="${1:-$REPO_ROOT/frontend/tinytoes-app/dist}"
TARGET_DIR="$PROJECT_ROOT/TinyToes/Bundle/www"

if [ ! -d "$DIST_DIR" ]; then
  echo "Error: dist directory not found at $DIST_DIR"
  echo "Run 'pnpm build' in frontend/tinytoes-app first."
  exit 1
fi

echo "Syncing web assets..."
echo "  From: $DIST_DIR"
echo "  To:   $TARGET_DIR"

# Clean target (except .gitkeep)
find "$TARGET_DIR" -mindepth 1 ! -name '.gitkeep' -delete 2>/dev/null || true

# Copy dist contents
cp -R "$DIST_DIR"/. "$TARGET_DIR"/

echo "Done. $(find "$TARGET_DIR" -type f | wc -l | tr -d ' ') files synced."
