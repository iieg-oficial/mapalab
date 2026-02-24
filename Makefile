.PHONY: help network-create network-remove dev prod down build-prod logs logs-backend logs-frontend logs-nginx clean status

FRONTEND_DIR=frontend
BACKEND_DIR=backend
NGINX_DIR=nginx
NETWORK_NAME=mapalab-network

help:
	@echo "MapaLab - Comandos disponibles:"
	@echo ""
	@echo "DESARROLLO:"
	@echo "  make dev              - Modo desarrollo (Vite dev server + Backend con /docs)"
	@echo "  make logs-dev         - Ver logs de desarrollo"
	@echo ""
	@echo "PRODUCCIÓN:"
	@echo "  make prod             - Modo producción (Nginx + Frontend estático + Backend sin /docs)"
	@echo "  make build-prod       - Construir imágenes de producción"
	@echo "  make logs-prod        - Ver logs de producción"
	@echo ""
	@echo "GENERAL:"
	@echo "  make down             - Detener todos los servicios"
	@echo "  make clean            - Detener servicios y limpiar todo"
	@echo "  make status           - Ver estado de los servicios"
	@echo "  make network-create   - Crear la red compartida"
	@echo ""

network-create:
	@echo "Creando red $(NETWORK_NAME)..."
	@docker network create $(NETWORK_NAME) 2>/dev/null || echo "Red $(NETWORK_NAME) ya existe"

network-remove:
	@echo "Eliminando red $(NETWORK_NAME)..."
	@docker network rm $(NETWORK_NAME) 2>/dev/null || echo "Red $(NETWORK_NAME) no existe"

dev: network-create
	@echo ""
	@echo "MODO DESARROLLO"
	@echo "=================="
	@echo ""
	@echo "Configurando variables de entorno..."
	@cd $(FRONTEND_DIR) && if [ ! -f .env.development ]; then cp .env.development.example .env.development; fi
	@cd $(BACKEND_DIR) && if [ ! -f .env.development ]; then cp .env.example .env.development; fi
	@echo ""
	@echo "Levantando servicios de desarrollo..."
	@cd $(BACKEND_DIR) && cp .env.development .env && docker compose up -d
	@cd $(FRONTEND_DIR) && docker compose --env-file .env.development -f docker-compose.dev.yml up -d
	@echo ""
	@echo "SERVICIOS LEVANTADOS EN DESARROLLO"
	@echo "======================================"
	@echo ""
	@FP=$$(grep '^FRONTEND_PORT=' $(FRONTEND_DIR)/.env.development 2>/dev/null | cut -d '=' -f2); \
	if [ -z "$$FP" ]; then FP=$$(grep '^VITE_PORT=' $(FRONTEND_DIR)/.env.development 2>/dev/null | cut -d '=' -f2); fi; \
	if [ -z "$$FP" ]; then FP=5173; fi; \
	BP=$$(grep '^BACKEND_PORT=' $(BACKEND_DIR)/.env.development 2>/dev/null | cut -d '=' -f2); \
	if [ -z "$$BP" ]; then BP=8000; fi; \
	echo "  Frontend (Vite dev):  http://localhost:$$FP"; \
	echo "  Backend API:          http://localhost:$$BP"; \
	echo "  Backend Docs:         http://localhost:$$BP/docs"; \
	echo "  Backend ReDoc:        http://localhost:$$BP/redoc"
	@echo ""
	@echo "Hot-reload activado en frontend y backend"
	@echo "Nginx NO se usa en desarrollo"
	@echo ""

prod: network-create
	@echo ""
	@echo "MODO PRODUCCIÓN"
	@echo "=================="
	@echo ""
	@echo "Configurando variables de entorno..."
	@cd $(FRONTEND_DIR) && if [ ! -f .env.production ]; then cp .env.example .env.production; fi
	@cd $(BACKEND_DIR) && if [ ! -f .env.production ]; then cp .env.example .env.production; fi
	@cd $(NGINX_DIR) && if [ ! -f .env ]; then \
		cp .env.example .env 2>/dev/null || true; \
	fi
	@echo ""
	@echo "Construyendo frontend..."
	@echo "Instalando dependencias y construyendo en Docker..."
	@docker run --rm -v $(CURDIR)/$(FRONTEND_DIR):/app -w /app node:24-alpine /bin/sh -c "(npm install || npm install --legacy-peer-deps) && npm run build"
	@echo ""
	@echo "Levantando servicios de producción..."
	@cd $(BACKEND_DIR) && cp .env.production .env && docker compose -f docker-compose.prod.yaml up -d
	@cd $(NGINX_DIR) && docker compose up -d --build
	@echo ""
	@echo "SERVICIOS LEVANTADOS EN PRODUCCIÓN"
	@echo "======================================"
	@echo ""
	@echo "  Aplicación:           http://localhost"
	@echo "  Backend API:          http://localhost/api"
	@echo "  GeoServer:            http://localhost/geoserver/"
	@echo ""
	@echo "Frontend servido como archivos estáticos desde nginx"
	@echo "/docs y /redoc están deshabilitados en producción"
	@echo ""

build-prod:
	@echo "Construyendo imágenes de producción..."
	@echo "Construyendo imágenes de producción..."
	@docker run --rm -v $(CURDIR)/$(FRONTEND_DIR):/app -w /app node:24-alpine /bin/sh -c "(npm install || npm install --legacy-peer-deps) && npm run build"
	@cd $(BACKEND_DIR) && docker compose -f docker-compose.prod.yaml build
	@cd $(NGINX_DIR) && docker compose build
	@echo "Imágenes construidas"

down:
	@echo "Deteniendo todos los servicios..."
	@cd $(NGINX_DIR) && docker compose down 2>/dev/null || true
	@cd $(FRONTEND_DIR) && docker compose -f docker-compose.dev.yml down 2>/dev/null || true
	@cd $(FRONTEND_DIR) && docker compose down 2>/dev/null || true
	@cd $(BACKEND_DIR) && docker compose down 2>/dev/null || true
	@cd $(BACKEND_DIR) && docker compose -f docker-compose.prod.yaml down 2>/dev/null || true
	@echo "Servicios detenidos"

clean: down
	@echo "Limpiando volúmenes y archivos generados..."
	@cd $(BACKEND_DIR) && docker compose down -v --remove-orphans 2>/dev/null || true
	@cd $(BACKEND_DIR) && docker compose -f docker-compose.prod.yaml down -v 2>/dev/null || true
	@cd $(FRONTEND_DIR) && docker compose -f docker-compose.dev.yml down -v 2>/dev/null || true
	@cd $(NGINX_DIR) && docker compose down -v 2>/dev/null || true
	@rm -rf $(FRONTEND_DIR)/dist 2>/dev/null || true
	@rm -rf $(FRONTEND_DIR)/node_modules 2>/dev/null || true
	@$(MAKE) network-remove
	@echo "Limpieza completada"

logs-dev:
	@echo "Logs de desarrollo (frontend + backend):"
	@docker compose -f $(BACKEND_DIR)/docker-compose.yaml -f $(FRONTEND_DIR)/docker-compose.dev.yml logs -f

logs-prod:
	@echo "Logs de producción (nginx + backend):"
	@docker compose -f $(BACKEND_DIR)/docker-compose.prod.yaml -f $(NGINX_DIR)/docker-compose.yml logs -f

logs-backend:
	@cd $(BACKEND_DIR) && docker compose logs -f

logs-frontend:
	@cd $(FRONTEND_DIR) && docker compose -f docker-compose.dev.yml logs -f

logs-nginx:
	@cd $(NGINX_DIR) && docker compose logs -f

status:
	@echo "Estado de los servicios:"
	@echo ""
	@echo "=== DESARROLLO ==="
	@echo "Frontend (Vite dev):"
	@cd $(FRONTEND_DIR) && docker compose -f docker-compose.dev.yml ps 2>/dev/null || echo "  No está corriendo"
	@echo ""
	@echo "Backend (development):"
	@cd $(BACKEND_DIR) && docker compose ps 2>/dev/null || echo "  No está corriendo"
	@echo ""
	@echo "=== PRODUCCIÓN ==="
	@echo "Nginx:"
	@cd $(NGINX_DIR) && docker compose ps 2>/dev/null || echo "  No está corriendo"
	@echo ""
	@echo "Backend (production):"
	@cd $(BACKEND_DIR) && docker compose -f docker-compose.prod.yaml ps 2>/dev/null || echo "  No está corriendo"
	@echo ""
	@if [ -d "$(FRONTEND_DIR)/dist" ]; then \
		echo "Frontend dist/: Existe"; \
	else \
		echo "Frontend dist/: No existe (ejecuta 'make prod' para generar)"; \
	fi
