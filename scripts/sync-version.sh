#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION=$(node -p "require('$REPO_ROOT/frontend/package.json').version")


printf '__version__ = "%s"\n' "$VERSION" > "$REPO_ROOT/backend/app/__version__.py"

LOCK_VERSION=$(node -p "require('$REPO_ROOT/frontend/package-lock.json').version")
if [ "$VERSION" != "$LOCK_VERSION" ]; then
    cd "$REPO_ROOT/frontend" && npm install --package-lock-only --silent
fi
