BACKEND_HOST="${BACKEND_HOST:-http://localhost:8000}"

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
    curl -fsS -X POST "$BACKEND_HOST/layers/refresh-cache" | python3 -m json.tool
}

clean_artifacts() {
    rm -rf frontend/node_modules
    row 'Artefactos' 'eliminados' "$C_GREEN" 'node_modules/'
}
