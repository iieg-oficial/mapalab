purge_gateway_cache() {
    if ! docker inspect gateway-hub-nginx-1 >/dev/null 2>&1; then
        row 'Gateway' 'en otro nodo' "$C_YELLOW" 'purga su cache de mapalab_assets alla'
        return 0
    fi
    if docker exec gateway-hub-nginx-1 sh -c \
        'rm -rf /var/cache/nginx-data/mapalab_assets/* /var/cache/nginx/mapalab_assets/* 2>/dev/null; nginx -s reload' >/dev/null 2>&1; then
        row 'Gateway' 'cache purgado' "$C_GREEN"
    else
        row 'Gateway' 'sin purgar' "$C_YELLOW" 'revisa el cache del gateway a mano'
    fi
}

refresh_layer_tree() {
    local env=$1 out
    if ! out=$(dc "$env" exec -T backend python - 2>&1 <<'PY'
import json
import os
import sys
import urllib.error
import urllib.request

from app.config import settings

req = urllib.request.Request(
    f"http://127.0.0.1:{os.environ['BACKEND_PORT']}/layers/refresh-cache",
    method='POST',
    headers={'X-Internal-Token': settings.MAPALAB_INTERNAL_TOKEN or ''},
)
try:
    with urllib.request.urlopen(req, timeout=300) as res:
        body = json.load(res)
except urllib.error.HTTPError as err:
    sys.exit(f'HTTP {err.code}: {err.read().decode()}')
print(f"{body['layer_count']} capas, etag {body['etag']}")
PY
    ); then
        fail "Arbol:${out##*$'\n'}" 'Revisa MAPALAB_INTERNAL_TOKEN y los logs del backend.'
    fi
    row 'Arbol' 'regenerado' "$C_GREEN" "$out"
}

clean_artifacts() {
    rm -rf frontend/node_modules
    row 'Artefactos' 'eliminados' "$C_GREEN" 'node_modules/'
}
