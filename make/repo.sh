BACKEND_HOST="${BACKEND_HOST:-http://localhost:8000}"

reset_dist_perms() {
    docker run --rm -v "$(pwd)/frontend":/w alpine sh -c \
        "rm -rf /w/dist && mkdir -m 0755 -p /w/dist && chown $(id -u):$(id -g) /w/dist"
    row 'Dist' 'limpio' "$C_GREEN" 'frontend/dist'
}

build_frontend() {
    dc prod --profile build run --rm --build frontend-build
}

purge_gateway_cache() {
    docker exec gateway-hub-nginx-1 sh -c \
        'rm -rf /var/cache/nginx/mapalab_assets/* 2>/dev/null; nginx -s reload' 2>/dev/null || true
    row 'Gateway' 'cache purgado' "$C_GREEN"
}

refresh_layer_tree() {
    curl -fsS -X POST "$BACKEND_HOST/layers/refresh-cache" | python3 -m json.tool
}

clean_artifacts() {
    docker run --rm -v "$(pwd)/frontend/dist":/dist alpine sh -c 'rm -rf /dist/*' 2>/dev/null || true
    rm -rf frontend/dist frontend/node_modules
    row 'Artefactos' 'eliminados' "$C_GREEN" 'dist/, node_modules/'
}
