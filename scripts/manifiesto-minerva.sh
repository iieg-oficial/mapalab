#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production}"
if [ ! -f "$ENV_FILE" ]; then
    echo "No existe $ENV_FILE" >&2
    exit 1
fi

DOMINIO="$(grep -m1 '^DOMINIO=' "$ENV_FILE" | cut -d= -f2-)"
if [ -z "$DOMINIO" ]; then
    echo "Falta DOMINIO en $ENV_FILE" >&2
    exit 1
fi

DIR="$(cd "$(dirname "$0")/.." && pwd)"
sed "s#\${SITIO}#https://${DOMINIO}#g" "$DIR/manifest.minerva.yml"
