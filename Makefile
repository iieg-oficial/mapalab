.PHONY: help dev prod deploy down down-dev down-prod build logs logs-dev logs-prod status clean setup-hooks ensure-networks refresh-layer-tree reset-dist-perms

# UID/GID del host para que volumes escritos por contenedores (ej. frontend-build → dist/) tengan ownership correcto
export UID := $(shell id -u)
export GID := $(shell id -g)

# Compose base commands por entorno
COMPOSE_BASE = compose.yaml
COMPOSE_DEV  = docker compose --env-file .env.development -f $(COMPOSE_BASE) -f compose.dev.yaml
COMPOSE_PROD = docker compose --env-file .env.production -f $(COMPOSE_BASE) -f compose.prod.yaml

help:
	@echo "MapaLab - Comandos disponibles:"
	@echo ""
	@echo "DESARROLLO:"
	@echo "  make dev          - Modo desarrollo (Vite + Backend hot-reload)"
	@echo "  make logs-dev     - Ver logs de desarrollo"
	@echo "  make down-dev     - Detener servicios de desarrollo"
	@echo ""
	@echo "PRODUCCION:"
	@echo "  make prod         - Modo produccion (Nginx + Backend Gunicorn)"
	@echo "  make deploy       - Build + up en produccion (usado por CD)"
	@echo "  make logs-prod    - Ver logs de produccion"
	@echo "  make down-prod    - Detener servicios de produccion"
	@echo ""
	@echo "GENERAL:"
	@echo "  make down              - Detener todos los servicios"
	@echo "  make clean             - Detener servicios y limpiar todo"
	@echo "  make status            - Ver estado de los servicios"
	@echo "  make setup-hooks       - Configurar git hooks del proyecto"
	@echo "  make refresh-layer-tree - Regenerar cache del arbol de capas en DB"

ensure-networks:
	@docker network create iieg-network 2>/dev/null || true

setup-hooks:
	@git config core.hooksPath .githooks
	@echo "Hooks configurados en .githooks/"

dev: setup-hooks
	@echo ""
	@echo "Levantando servicios de desarrollo..."
	@$(COMPOSE_DEV) up -d
	@echo ""
	@echo "Frontend (Vite):  http://localhost:3006"
	@echo "Backend API:      http://localhost:8000"
	@echo "Backend Docs:     http://localhost:8000/docs"
	@echo ""
	@echo "Hot-reload activado en frontend y backend"

prod: ensure-networks
	@echo ""
	@echo "Construyendo frontend..."
	@$(COMPOSE_PROD) --profile build run --rm --build frontend-build
	@echo ""
	@echo "Levantando servicios de produccion..."
	@$(COMPOSE_PROD) up -d --build
	@echo ""
	@echo "Aplicacion lista"

deploy: ensure-networks reset-dist-perms
	@echo "Desplegando en produccion..."
	@$(COMPOSE_PROD) --profile build run --rm --build frontend-build
	@$(COMPOSE_PROD) up -d --build --force-recreate
	@docker exec gateway-hub-nginx-1 sh -c "rm -rf /var/cache/nginx/mapalab_assets/* 2>/dev/null; nginx -s reload" 2>/dev/null || true
	@echo "Deploy completado"

reset-dist-perms:
	@docker run --rm -v "$(CURDIR)/frontend":/w alpine sh -c "rm -rf /w/dist && mkdir -m 0755 -p /w/dist && chown $$(id -u):$$(id -g) /w/dist"

down: down-dev down-prod

down-dev:
	@$(COMPOSE_DEV) down 2>/dev/null || true
	@echo "Servicios de desarrollo detenidos"

down-prod:
	@$(COMPOSE_PROD) --profile build down 2>/dev/null || true
	@echo "Servicios de produccion detenidos"

clean: down
	@$(COMPOSE_DEV) down -v --remove-orphans 2>/dev/null || true
	@$(COMPOSE_PROD) --profile build down -v --remove-orphans 2>/dev/null || true
	@docker run --rm -v $(CURDIR)/frontend/dist:/dist alpine sh -c "rm -rf /dist/*" 2>/dev/null || true
	@rm -rf frontend/dist frontend/node_modules
	@echo "Limpieza completada"

logs-dev:
	@$(COMPOSE_DEV) logs -f

logs-prod:
	@$(COMPOSE_PROD) logs -f

logs:
	@$(COMPOSE_DEV) logs -f

status:
	@echo "=== DESARROLLO ==="
	@$(COMPOSE_DEV) ps 2>/dev/null || echo "  No hay servicios de desarrollo corriendo"
	@echo ""
	@echo "=== PRODUCCION ==="
	@$(COMPOSE_PROD) ps 2>/dev/null || echo "  No hay servicios de produccion corriendo"

BACKEND_HOST ?= http://localhost:8000
DATAENGINE_DIR ?= ../dataengine

refresh-layer-tree:
	@if [ -d $(DATAENGINE_DIR) ] && docker ps --format '{{.Names}}' | grep -q '^dataengine-jobs$$'; then \
		$(MAKE) -C $(DATAENGINE_DIR) refresh-layer-tree; \
	else \
		echo "Fallback: trigger vía endpoint del backend"; \
		curl -fsS -X POST $(BACKEND_HOST)/layers/refresh-cache | python3 -m json.tool; \
	fi

mcp:
	@docker exec -i -e PYTHONPATH=/app mapalab-mapalab-mcp-1 python servers/mapalab.py

