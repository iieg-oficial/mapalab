#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION=$(node -p "require('$REPO_ROOT/frontend/package.json').version")

sed -i "s/^\*\*Version:\*\* .*/**Version:** $VERSION/" "$REPO_ROOT/README.md"

LOCK_VERSION=$(node -p "require('$REPO_ROOT/frontend/package-lock.json').version")
if [ "$VERSION" != "$LOCK_VERSION" ]; then
    cd "$REPO_ROOT/frontend" && npm install --package-lock-only --silent
fi
