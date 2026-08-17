#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_DIR="$REPO_ROOT/plugin"
DIST_DIR="$REPO_ROOT/dist"
VERSION=$(grep '^version=' "$PLUGIN_DIR/metadata.txt" | cut -d= -f2)
NOMBRE="mapalab-qgis-$VERSION.zip"

rm -rf "$DIST_DIR/mapalab" "$DIST_DIR/$NOMBRE"
mkdir -p "$DIST_DIR"
cp -r "$PLUGIN_DIR" "$DIST_DIR/mapalab"
find "$DIST_DIR/mapalab" -name '__pycache__' -type d -prune -exec rm -rf {} +
find "$DIST_DIR/mapalab" -name '*.pyc' -delete

cd "$DIST_DIR"
zip -qr "$NOMBRE" mapalab
rm -rf "$DIST_DIR/mapalab"
cp "$NOMBRE" mapalab-qgis.zip

echo "$DIST_DIR/$NOMBRE"
