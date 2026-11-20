#!/bin/sh
# Graba un guion y lo renderiza: demo/hacer.sh dia-de-muertos → demo/video/salida/dia-de-muertos.mp4
set -e
cd "$(dirname "$0")"

GUION=$1
if [ -z "$GUION" ] || [ ! -f "guiones/$GUION.mjs" ]; then
    echo "Uso: demo/hacer.sh <guion>. Disponibles:"
    ls guiones | sed 's/\.mjs$//; s/^/  /'
    exit 1
fi

# Chrome con ventana: el firewall del sitio bloquea a Chrome headless.
if ! curl -s localhost:9222/json/version >/dev/null; then
    echo "Abriendo Chrome con el puerto de depuración…"
    google-chrome-stable --remote-debugging-port=9222 --user-data-dir="$HOME/.chrome-demo-mapalab" \
        --window-size=1920,1080 about:blank >/dev/null 2>&1 &
    for _ in $(seq 40); do
        curl -s localhost:9222/json/version >/dev/null && break
        sleep 0.5
    done
fi

./pw.sh node grabar.mjs "$GUION"

cd video
[ -d node_modules ] || ../pw.sh npm ci --no-audit --no-fund
mkdir -p salida
../pw.sh npx remotion render src/index.jsx Demo "salida/$GUION.mp4" --props="{\"guion\":\"$GUION\"}" --crf=18 --log=error
echo "Listo: $(pwd)/salida/$GUION.mp4"
