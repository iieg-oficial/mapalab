#!/bin/sh
# Corre un comando (node, npm, npx) en la imagen de Playwright, que trae Chromium y sus librerías.
exec docker run --rm -i --network=host --ipc=host \
    -u "$(id -u):$(id -g)" -v "$HOME:$HOME" -e HOME="$HOME" -w "$PWD" \
    mcr.microsoft.com/playwright:v1.62.1-noble "$@"
