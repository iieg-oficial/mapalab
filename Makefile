REPO_NAME    := mapalab
COMPOSE_PROD := -f compose.yaml -f compose.prod.yaml
COMPOSE_DEV  := -f compose.yaml -f compose.dev.yaml
ENV_PROD     := .env.production
ENV_DEV      := .env.development

UP_PRE        := setup-hooks
UP_GUARDS      = ensure_network
DEPLOY_GUARDS  = ensure_network
DEPLOY_CMD     = dc prod up -d --build --force-recreate
DEPLOY_POST    = purge_gateway_cache
CLEAN_EXTRA    = clean_artifacts

include make/common.mk
include make/mapalab.mk
