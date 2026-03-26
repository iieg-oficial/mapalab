.PHONY: help network-create network-remove dev prod ssl ssl-local ssl-down down build-prod deploy logs logs-backend logs-frontend logs-nginx clean status setup-hooks

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
	@echo "  make prod             - Modo administración (subruta /mapalab/, Nginx + Frontend estático + Backend)"
	@echo "  make ssl              - Modo HTTPS GCP (Let's Encrypt, requiere APP_DOMAIN y SSL_EMAIL en nginx/.env)"
	@echo "  make ssl-local        - Modo HTTPS local (certificado autofirmado, APP_DOMAIN puede ser IP)"
	@echo "  make build-prod       - Construir imágenes de producción"
	@echo "  make logs-prod        - Ver logs de producción"
	@echo ""
	@echo "GENERAL:"
	@echo "  make down             - Detener todos los servicios"
	@echo "  make clean            - Detener servicios y limpiar todo"
	@echo "  make status           - Ver estado de los servicios"
	@echo "  make network-create   - Crear la red compartida"
	@echo "  make setup-hooks      - Configurar git hooks del proyecto"
	@echo ""

setup-hooks:
	@echo "Configurando git hooks..."
	@git config core.hooksPath .githooks
	@echo "Hooks configurados en .githooks/"

network-create:
	@echo "Creando red $(NETWORK_NAME)..."
	@docker network create $(NETWORK_NAME) 2>/dev/null || echo "Red $(NETWORK_NAME) ya existe"

network-remove:
	@echo "Eliminando red $(NETWORK_NAME)..."
	@docker network rm $(NETWORK_NAME) 2>/dev/null || echo "Red $(NETWORK_NAME) no existe"

dev: network-create setup-hooks
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
	@echo "MODO PRODUCCIÓN (ADMINISTRACIÓN - /mapalab/)"
	@echo "==============================================="
	@echo ""
	@echo "Configurando variables de entorno..."
	@cd $(FRONTEND_DIR) && if [ ! -f .env.production ]; then cp .env.example .env.production; fi
	@cd $(BACKEND_DIR) && if [ ! -f .env.production ]; then cp .env.example .env.production; fi
	@cd $(NGINX_DIR) && if [ ! -f .env ]; then \
		cp .env.example .env 2>/dev/null || true; \
	fi
	@sed -i "s|^VITE_BASE_PATH=.*|VITE_BASE_PATH=/mapalab/|" $(FRONTEND_DIR)/.env.production
	@sed -i "s|^VITE_BACKEND_API_HOST=.*|VITE_BACKEND_API_HOST=/mapalab/api/|" $(FRONTEND_DIR)/.env.production
	@echo ""
	@echo "Construyendo frontend (base: /mapalab/)..."
	@docker run --rm -v $(CURDIR)/$(FRONTEND_DIR):/app -w /app node:24-alpine /bin/sh -c "(npm install || npm install --legacy-peer-deps) && npm run build"
	@echo ""
	@echo "Levantando servicios de producción..."
	@cd $(BACKEND_DIR) && cp .env.production .env && docker compose -f docker-compose.prod.yaml up -d
	@cd $(NGINX_DIR) && docker compose up -d --build
	@echo ""
	@echo "SERVICIOS LEVANTADOS EN PRODUCCIÓN"
	@echo "======================================"
	@echo ""
	@echo "  Aplicación:           http://localhost/mapalab/"
	@echo "  Backend API:          http://localhost/api"
	@echo "  GeoServer:            http://localhost/geoserver/"
	@echo ""
	@echo "Frontend servido en subruta /mapalab/ desde nginx"
	@echo "/docs y /redoc están deshabilitados en producción"
	@echo ""

ssl: network-create
	@echo ""
	@echo "MODO SSL GCP (LET'S ENCRYPT)"
	@echo "=============================="
	@echo ""
	@cd $(FRONTEND_DIR) && if [ ! -f .env.production ]; then cp .env.example .env.production; fi
	@cd $(BACKEND_DIR) && if [ ! -f .env.production ]; then cp .env.example .env.production; fi
	@cd $(NGINX_DIR) && if [ ! -f .env ]; then cp .env.example .env 2>/dev/null || true; fi
	@DOMAIN=$$(grep '^APP_DOMAIN=' $(NGINX_DIR)/.env | cut -d'=' -f2); \
	EMAIL=$$(grep '^SSL_EMAIL=' $(NGINX_DIR)/.env | cut -d'=' -f2); \
	if [ -z "$$DOMAIN" ]; then echo "ERROR: APP_DOMAIN no definido en $(NGINX_DIR)/.env" && exit 1; fi; \
	if [ -z "$$EMAIL" ]; then echo "ERROR: SSL_EMAIL no definido en $(NGINX_DIR)/.env" && exit 1; fi; \
	echo "Dominio: $$DOMAIN"; \
	echo ""; \
	echo "Configurando dominio en archivos de entorno..."; \
	sed -i "s|^VITE_BASE_PATH=.*|VITE_BASE_PATH=/|" $(FRONTEND_DIR)/.env.production; \
	sed -i "s|^VITE_BACKEND_API_HOST=.*|VITE_BACKEND_API_HOST=/api/|" $(FRONTEND_DIR)/.env.production; \
	sed -i "s|^VITE_SITE_URL=.*|VITE_SITE_URL=https://$$DOMAIN|" $(FRONTEND_DIR)/.env.production; \
	sed -i "s|^CORS_ALLOWED_ORIGIN=.*|CORS_ALLOWED_ORIGIN=https://$$DOMAIN|" $(FRONTEND_DIR)/.env.production; \
	sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=[\"https://$$DOMAIN\"]|" $(BACKEND_DIR)/.env.production; \
	echo ""; \
	echo "Obteniendo certificado Let's Encrypt..."; \
	mkdir -p $(CURDIR)/$(NGINX_DIR)/ssl/letsencrypt; \
	docker run --rm -p 80:80 \
		-v $(CURDIR)/$(NGINX_DIR)/ssl/letsencrypt:/etc/letsencrypt \
		certbot/certbot certonly --standalone \
		--non-interactive --agree-tos \
		--email $$EMAIL -d $$DOMAIN; \
	cp -L $(CURDIR)/$(NGINX_DIR)/ssl/letsencrypt/live/$$DOMAIN/fullchain.pem $(CURDIR)/$(NGINX_DIR)/ssl/cert.pem; \
	cp -L $(CURDIR)/$(NGINX_DIR)/ssl/letsencrypt/live/$$DOMAIN/privkey.pem $(CURDIR)/$(NGINX_DIR)/ssl/key.pem; \
	chmod 600 $(CURDIR)/$(NGINX_DIR)/ssl/key.pem; \
	echo "Certificado obtenido"
	@echo ""
	@echo "Construyendo frontend..."
	@docker run --rm -v $(CURDIR)/$(FRONTEND_DIR):/app -w /app node:24-alpine /bin/sh -c "(npm install || npm install --legacy-peer-deps) && npm run build"
	@echo ""
	@echo "Levantando servicios..."
	@cd $(BACKEND_DIR) && cp .env.production .env && docker compose -f docker-compose.prod.yaml up -d
	@cd $(NGINX_DIR) && docker compose -f docker-compose.ssl.yml up -d --build
	@echo ""
	@echo "SERVICIOS LEVANTADOS EN GCP"
	@echo "=============================="
	@echo ""
	@DOMAIN=$$(grep '^APP_DOMAIN=' $(NGINX_DIR)/.env | cut -d'=' -f2); \
	echo "  Aplicación:  https://$$DOMAIN"; \
	echo "  Backend API: https://$$DOMAIN/api"
	@echo ""

ssl-local: network-create
	@echo ""
	@echo "MODO SSL LOCAL (CERTIFICADO AUTOFIRMADO)"
	@echo "========================================="
	@echo ""
	@echo "Configurando variables de entorno..."
	@cd $(FRONTEND_DIR) && if [ ! -f .env.production ]; then cp .env.example .env.production; fi
	@cd $(BACKEND_DIR) && if [ ! -f .env.production ]; then cp .env.example .env.production; fi
	@cd $(NGINX_DIR) && if [ ! -f .env ]; then cp .env.example .env 2>/dev/null || true; fi
	@sed -i "s|^VITE_BASE_PATH=.*|VITE_BASE_PATH=/|" $(FRONTEND_DIR)/.env.production
	@sed -i "s|^VITE_BACKEND_API_HOST=.*|VITE_BACKEND_API_HOST=/api/|" $(FRONTEND_DIR)/.env.production
	@echo ""
	@echo "Generando certificado autofirmado..."
	@mkdir -p $(NGINX_DIR)/ssl
	@if [ ! -f $(NGINX_DIR)/ssl/cert.pem ]; then \
		DOMAIN=$$(grep '^APP_DOMAIN=' $(NGINX_DIR)/.env | cut -d'=' -f2); \
		if [ -z "$$DOMAIN" ]; then DOMAIN=localhost; fi; \
		openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
			-keyout $(NGINX_DIR)/ssl/key.pem \
			-out $(NGINX_DIR)/ssl/cert.pem \
			-subj "/CN=$$DOMAIN" 2>/dev/null && \
		echo "Certificado generado para: $$DOMAIN"; \
	else \
		echo "Certificado ya existe, reutilizando..."; \
	fi
	@echo ""
	@echo "Construyendo frontend..."
	@docker run --rm -v $(CURDIR)/$(FRONTEND_DIR):/app -w /app node:24-alpine /bin/sh -c "(npm install || npm install --legacy-peer-deps) && npm run build"
	@echo ""
	@echo "Levantando servicios..."
	@cd $(BACKEND_DIR) && cp .env.production .env && docker compose -f docker-compose.prod.yaml up -d
	@cd $(NGINX_DIR) && docker compose -f docker-compose.ssl.yml up -d --build
	@echo ""
	@echo "SERVICIOS LEVANTADOS CON SSL LOCAL"
	@echo "====================================="
	@echo ""
	@DOMAIN=$$(grep '^APP_DOMAIN=' $(NGINX_DIR)/.env | cut -d'=' -f2); \
	if [ -z "$$DOMAIN" ]; then DOMAIN=localhost; fi; \
	echo "  Aplicación:  https://$$DOMAIN"; \
	echo "  Backend API: https://$$DOMAIN/api"
	@echo ""
	@echo "Certificado autofirmado (acepta la advertencia del navegador)"
	@echo ""

ssl-down:
	@echo "Deteniendo servicios SSL..."
	@cd $(NGINX_DIR) && docker compose -f docker-compose.ssl.yml down 2>/dev/null || true
	@cd $(BACKEND_DIR) && docker compose -f docker-compose.prod.yaml down 2>/dev/null || true
	@echo "Servicios detenidos"

build-prod:
	@echo "Construyendo imágenes de producción..."
	@docker run --rm -v $(CURDIR)/$(FRONTEND_DIR):/app -w /app node:24-alpine /bin/sh -c "(npm install || npm install --legacy-peer-deps) && npm run build"
	@cd $(BACKEND_DIR) && docker compose -f docker-compose.prod.yaml build
	@cd $(NGINX_DIR) && docker compose build
	@echo "Imágenes construidas"

deploy: network-create
	@echo ""
	@echo "DEPLOY (REBUILD + RESTART)"
	@echo "==========================="
	@echo ""
	@if grep -q '^SSL_MODE=true' $(NGINX_DIR)/.env 2>/dev/null; then \
		sed -i "s|^VITE_BASE_PATH=.*|VITE_BASE_PATH=/|" $(FRONTEND_DIR)/.env.production; \
		sed -i "s|^VITE_BACKEND_API_HOST=.*|VITE_BACKEND_API_HOST=/api/|" $(FRONTEND_DIR)/.env.production; \
		echo "Modo: GCP (raíz /)"; \
	else \
		sed -i "s|^VITE_BASE_PATH=.*|VITE_BASE_PATH=/mapalab/|" $(FRONTEND_DIR)/.env.production; \
		sed -i "s|^VITE_BACKEND_API_HOST=.*|VITE_BACKEND_API_HOST=/mapalab/api/|" $(FRONTEND_DIR)/.env.production; \
		echo "Modo: Administración (subruta /mapalab/)"; \
	fi
	@echo ""
	@echo "Construyendo frontend..."
	@docker run --rm -v $(CURDIR)/$(FRONTEND_DIR):/app -w /app node:24-alpine /bin/sh -c "(npm install || npm install --legacy-peer-deps) && npm run build"
	@echo ""
	@echo "Reiniciando servicios..."
	@cd $(BACKEND_DIR) && cp .env.production .env && docker compose -f docker-compose.prod.yaml up -d --build
	@if grep -q '^SSL_MODE=true' $(NGINX_DIR)/.env 2>/dev/null; then \
		cd $(NGINX_DIR) && docker compose -f docker-compose.ssl.yml up -d --build; \
	else \
		cd $(NGINX_DIR) && docker compose up -d --build; \
	fi
	@echo "Recargando Nginx..."
	@docker exec mapalab-nginx nginx -s reload 2>/dev/null || true
	@echo ""
	@echo "Deploy completado"
	@echo ""

down:
	@echo "Deteniendo todos los servicios..."
	@cd $(NGINX_DIR) && docker compose down 2>/dev/null || true
	@cd $(NGINX_DIR) && docker compose -f docker-compose.ssl.yml down 2>/dev/null || true
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
