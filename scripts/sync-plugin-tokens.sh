#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESTINO="$REPO_ROOT/plugin/theme.qss"
MARCA="${MARIACHI_MARCA:-iieg}"
RUTA="identidad/$MARCA/artefactos/tokens.qss"

if [ -n "$1" ]; then
    cp "$1" "$DESTINO"
    echo "theme.qss actualizado desde $1"
    exit 0
fi

if [ -z "$MARIACHI_URL" ] || [ -z "$MARIACHI_TOKEN" ]; then
    echo "Faltan MARIACHI_URL y MARIACHI_TOKEN, o la ruta a un tokens.qss ya descargado." >&2
    echo "  make plugin-tokens ARCHIVO=~/Descargas/tokens.qss" >&2
    echo "  MARIACHI_URL=https://<gateway> MARIACHI_TOKEN=<jwt> make plugin-tokens" >&2
    exit 1
fi

TMP=$(mktemp)
curl -fsS -H "Authorization: Bearer $MARIACHI_TOKEN" \
    "$MARIACHI_URL/api/mariachi/$RUTA" -o "$TMP"

if ! head -1 "$TMP" | grep -q 'Generado por mariachi'; then
    echo "La respuesta no es el artefacto de identidad." >&2
    rm -f "$TMP"
    exit 1
fi

mv "$TMP" "$DESTINO"
echo "theme.qss actualizado desde $MARIACHI_URL"
