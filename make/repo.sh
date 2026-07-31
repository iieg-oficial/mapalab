BACKEND_HOST="${BACKEND_HOST:-http://localhost:8000}"

purge_gateway_cache() {
    docker exec gateway-hub-nginx-1 sh -c \
        'rm -rf /var/cache/nginx/mapalab_assets/* 2>/dev/null; nginx -s reload' 2>/dev/null || true
    row 'Gateway' 'cache purgado' "$C_GREEN"
}

refresh_layer_tree() {
    curl -fsS -X POST "$BACKEND_HOST/layers/refresh-cache" | python3 -m json.tool
}

clean_artifacts() {
    rm -rf frontend/node_modules
    row 'Artefactos' 'eliminados' "$C_GREEN" 'node_modules/'
}
