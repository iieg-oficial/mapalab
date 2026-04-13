.PHONY: help dev staging prod deploy down down-dev down-staging build logs logs-dev logs-staging status clean setup-hooks ensure-networks

# Compose base commands por entorno
COMPOSE_DEV     = docker compose -p mapalab-dev --env-file .env.development
COMPOSE_STAGING = docker compose -p mapalab-staging -f docker-compose.yml --env-file .env.staging
COMPOSE_PROD    = docker compose -p mapalab -f docker-compose.yml --env-file .env.production

help:
	@echo "MapaLab - Comandos disponibles:"
	@echo ""
	@echo "DESARROLLO:"
	@echo "  make dev          - Modo desarrollo (Vite + Backend hot-reload)"
	@echo "  make logs-dev     - Ver logs de desarrollo"
	@echo "  make down-dev     - Detener servicios de desarrollo"
	@echo ""
	@echo "STAGING/PRODUCCION:"
	@echo "  make staging      - Modo staging (Nginx + Backend Gunicorn)"
	@echo "  make prod         - Alias de staging con .env.production"
	@echo "  make deploy       - Build + up en produccion (usado por CD)"
	@echo "  make logs-staging - Ver logs de staging"
	@echo "  make down-staging - Detener servicios de staging"
	@echo ""
	@echo "GENERAL:"
	@echo "  make down         - Detener todos los servicios"
	@echo "  make clean        - Detener servicios y limpiar todo"
	@echo "  make status       - Ver estado de los servicios"
	@echo "  make setup-hooks  - Configurar git hooks del proyecto"

ensure-networks:
	@docker network create iieg-network 2>/dev/null || true

setup-hooks:
	@git config core.hooksPath .githooks
	@echo "Hooks configurados en .githooks/"

dev: setup-hooks
	@echo ""
	@echo "Levantando servicios de desarrollo..."
	@$(COMPOSE_DEV) --profile dev up -d
	@echo ""
	@echo "Frontend (Vite):  http://localhost:5173"
	@echo "Backend API:      http://localhost:8001"
	@echo "Backend Docs:     http://localhost:8001/docs"
	@echo ""
	@echo "Hot-reload activado en frontend y backend"

staging: ensure-networks
	@echo ""
	@echo "Construyendo frontend..."
	@$(COMPOSE_STAGING) --profile build run --rm --build frontend-build
	@echo ""
	@echo "Levantando servicios de staging..."
	@$(COMPOSE_STAGING) --profile staging up -d --build
	@echo ""
	@echo "Aplicacion: http://localhost:3006"

prod: ensure-networks
	@echo ""
	@echo "Construyendo frontend..."
	@$(COMPOSE_PROD) --profile build run --rm --build frontend-build
	@echo ""
	@echo "Levantando servicios de produccion..."
	@$(COMPOSE_PROD) --profile staging up -d --build
	@echo ""
	@echo "Aplicacion lista"

deploy: ensure-networks
	@echo "Desplegando en produccion..."
	@$(COMPOSE_PROD) --profile build run --rm --build frontend-build
	@$(COMPOSE_PROD) --profile staging up -d --build --force-recreate
	@echo "Deploy completado"

down: down-dev down-staging

down-dev:
	@$(COMPOSE_DEV) --profile dev down 2>/dev/null || true
	@echo "Servicios de desarrollo detenidos"

down-staging:
	@$(COMPOSE_STAGING) --profile staging --profile build down 2>/dev/null || true
	@echo "Servicios de staging detenidos"

clean: down
	@$(COMPOSE_DEV) --profile dev down -v --remove-orphans 2>/dev/null || true
	@$(COMPOSE_STAGING) --profile staging --profile build down -v --remove-orphans 2>/dev/null || true
	@docker run --rm -v $(CURDIR)/frontend/dist:/dist alpine sh -c "rm -rf /dist/*" 2>/dev/null || true
	@rm -rf frontend/dist frontend/node_modules
	@echo "Limpieza completada"

logs-dev:
	@$(COMPOSE_DEV) --profile dev logs -f

logs-staging:
	@$(COMPOSE_STAGING) --profile staging logs -f

logs:
	@$(COMPOSE_DEV) --profile dev logs -f

status:
	@echo "=== DESARROLLO ==="
	@$(COMPOSE_DEV) ps 2>/dev/null || echo "  No hay servicios de desarrollo corriendo"
	@echo ""
	@echo "=== STAGING ==="
	@$(COMPOSE_STAGING) ps 2>/dev/null || echo "  No hay servicios de staging corriendo"
