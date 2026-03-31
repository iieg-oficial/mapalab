# MapaLab

Proyecto MapaLab del Instituto de Información Estadística y Geográfica del Estado de Jalisco (IIEG).

## Arquitectura

El proyecto está diseñado con **desarrollo y producción**:

### MODO DESARROLLO

![Application](https://img.shields.io/badge/Application-MAPALAB-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.1-yellow?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.2.1-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

**Stack:**
- Frontend: Vite dev server (Docker) en puerto 5173 con hot-reload
- Backend: FastAPI (Docker) en puerto 8000 con --reload
- **SIN nginx**

**Características:**
- Hot-reload en frontend y backend
- `/docs` y `/redoc` habilitados
- DEBUG=True, logs detallados
- Perfecto para agregar código y ver cambios al instante

**Flujo:**
```
Cliente → Frontend (localhost:5173) → Backend API (localhost:8000)
         ↓ Hot-reload
      Vite dev server
```

### MODO PRODUCCIÓN

**Stack:**
- Frontend: Archivos estáticos (dist/) servidos por nginx
- Backend: FastAPI (Docker) con Gunicorn en puerto 8000
- Nginx: Reverse proxy en puerto 80

**Características:**
- Frontend optimizado (build compilado)
- `/docs` y `/redoc` DESHABILITADOS
- DEBUG=False, logs censurados
- Nginx como punto de entrada único
- Proxy a GeoServer externo

**Flujo:**
```
Cliente → Nginx (localhost:80)
          ├─ /           → Archivos estáticos (frontend/dist/)
          ├─ /api/       → Backend FastAPI
          └─ /geoserver/ → GeoServer externo
```

## Estructura del Proyecto

```
mapalab/
├── frontend/              # Aplicación frontend (React + Vite)
│   ├── Dockerfile.dev        # Para desarrollo (Vite dev server)
│   ├── Dockerfile            # Para producción (build estático)
│   ├── docker-compose.dev.yml
│   ├── docker-compose.yml
│   ├── .env.development.example
│   └── .env.example
├── backend/               # API REST (FastAPI)
│   ├── Dockerfile            # Para desarrollo
│   ├── Dockerfile.prod       # Para producción (Gunicorn)
│   ├── docker-compose.yaml
│   ├── docker-compose.prod.yaml
│   └── .env.example
├── nginx/                 # Reverse proxy (SOLO PRODUCCIÓN)
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── Makefile              # Comandos para dev y prod
└── README.md             # Este archivo
```

## Requisitos Previos

- Docker
- Docker Compose
- Make (opcional, pero recomendado)

## Guía Rápida

### DESARROLLO

```bash
# Levantar en modo desarrollo
make dev

# Acceder a:
# - Frontend: http://localhost:5173 (Vite dev server con hot-reload)
# - Backend: http://localhost:8000
# - Docs: http://localhost:8000/docs
```

### PRODUCCIÓN

```bash
# Levantar en modo producción
make prod

# Acceder a:
# - Aplicación: http://localhost (nginx)
# - Backend API: http://localhost/api
# - GeoServer: http://localhost/geoserver/
```

## Configuración Detallada

### 1. Variables de Entorno

#### Frontend

**Desarrollo (`frontend/.env.development.example`):**
```bash
VITE_BACKEND_API_HOST=http://localhost:8000/
VITE_GEOSERVER_URL=http://localhost:8080/geoserver/
VITE_NODE_ENV=development
```

**Producción (`frontend/.env.example`):**
```bash
VITE_GOOGLE_ANALYTICS_ID=<id_analytics>
VITE_BACKEND_API_HOST=http://localhost:8000/
VITE_GEOSERVER_URL=http://localhost:8080/geoserver/
VITE_NODE_ENV=production
```

#### Backend

**Archivo único (`backend/.env.example`):**
```bash
# Cambia ENVIRONMENT según el modo
ENVIRONMENT=development  # o production
DEBUG=True  # o False
CORS_ORIGINS=["*"]
LOG_LEVEL=INFO
DB_USER=<YOUR_DB_USER>
DB_PASSWORD=<YOUR_DB_PASSWORD>
DB_HOST=<YOUR_DB_HOST>
DB_PORT=<YOUR_DB_PORT>
DB_NAME=<YOUR_DB_NAME>
GEOSERVER_URL=<YOUR_GEOSERVER_URL>
```

#### Nginx (Solo producción)

**Archivo (`nginx/.env.example`):**
```bash
NGINX_PORT=80
GEOSERVER_HOST=localhost
GEOSERVER_PORT=8080
```

### 2. Levantar Servicios

#### Opción 1: Con Make (Recomendado)

```bash
# Desarrollo
make dev

# Producción
make prod

# Ver comandos disponibles
make help
```

#### Opción 2: Manual

**Desarrollo:**
```bash
docker network create mapalab-network
cd backend
cp .env.example .env.development
# Edita .env.development
cp .env.development .env
docker compose up -d
cd ../frontend
cp .env.development.example .env.development
# Edita .env.development
docker compose -f docker-compose.dev.yml up -d
```

**Producción:**
```bash
docker network create mapalab-network
cd frontend
npm ci
npm run build
cd ../backend
cp .env.example .env.production
# Edita .env.production
cp .env.production .env
docker compose -f docker-compose.prod.yaml up -d
cd ../nginx
cp .env.example .env
# Edita .env
docker compose up -d
```

## Comandos Make Disponibles

### Desarrollo
| Comando | Descripción |
|---------|-------------|
| `make dev` | Levantar en modo desarrollo (Vite + Backend) |
| `make logs-dev` | Ver logs de desarrollo |
| `make logs-frontend` | Ver logs solo del frontend |
| `make logs-backend` | Ver logs solo del backend |

### Producción
| Comando | Descripción |
|---------|-------------|
| `make prod` | Levantar en modo producción (Nginx + Backend) |
| `make deploy` | Rebuild y restart de servicios (usado por CD) |
| `make build-prod` | Solo construir imágenes de producción |
| `make logs-prod` | Ver logs de producción |
| `make logs-nginx` | Ver logs solo de nginx |

### General
| Comando | Descripción |
|---------|-------------|
| `make down` | Detener todos los servicios |
| `make clean` | Detener y limpiar todo (volúmenes, dist/, node_modules) |
| `make status` | Ver estado de servicios |
| `make help` | Ver todos los comandos |

## Flujo de Trabajo Recomendado

### Desarrollo Activo

```bash
# 1. Levantar servicios
make dev

# 2. Editar código en frontend/src/ o backend/app/
#    Los cambios se reflejan automáticamente (hot-reload)

# 3. Ver logs si algo falla
make logs-dev

# 4. Detener cuando termines
make down
```

### Preparar para Producción

```bash
# 1. Probar en modo producción local
make prod

# 2. Verificar en http://localhost

# 3. Detener
make down
```

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [Periodicidad](docs/periodicidad.md) | Sistema de filtrado temporal: periodicidad vectorial (CQL), raster (TIME), `defaultDate`, selectores de fecha y loop de animación |
| [CI/CD](docs/ci-cd.md) | Pipeline de integracion y despliegue continuo con GitHub Actions, deploy SSH, health check y notificaciones Discord |
| [Roadmap](docs/roadmap.md) | Timeline del proyecto, versiones, features planeadas y propuestas futuras |
| [Analytics](docs/analytics.md) | Eventos GTM/GA4, tabla de eventos, parametros y KPIs |
| [Arquitectura](docs/arquitectura.md) | Diagramas de infraestructura, flujo de red, componentes y Docker |

## CI/CD

Pipeline automatizado con GitHub Actions. Al hacer push a `develop`, se ejecutan tests, se crea un PR a `production` con auto-merge, y al mergearse se despliega automaticamente via SSH con health check y notificacion a Discord.

```
push a develop → tests → PR a production → auto-merge → deploy → health check → Discord
```

Ver documentacion completa en [docs/ci-cd.md](docs/ci-cd.md).

## Notas Importantes

### Base de Datos

La base de datos PostgreSQL **NO** está incluida. Debe existir externamente y configurarse en `backend/.env`:

```bash
DB_HOST=<tu_host_de_postgres>
DB_PORT=5432
DB_USER=<usuario>
DB_PASSWORD=<contraseña>
DB_NAME=<nombre_db>
```

### GeoServer

GeoServer es un servicio **externo**. Configurar en `nginx/.env`:

```bash
GEOSERVER_HOST=<tu_host_geoserver>
GEOSERVER_PORT=8080
```

### Desarrollo del Frontend sin Docker

Si prefieres desarrollo local sin Docker:

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

Asegúrate de que `VITE_BACKEND_API_HOST` en `.env.development` apunte a tu backend.

## Troubleshooting

### Frontend muestra página vacía en desarrollo

**Solución:**
```bash
cd frontend
docker compose -f docker-compose.dev.yml logs
# Verificar que Vite esté corriendo en puerto 5173
```

### Backend no muestra /docs en desarrollo

**Causa:** Variable `ENVIRONMENT` no está en development

**Solución:**
```bash
cd backend
cat .env | grep ENVIRONMENT
# Debe decir: ENVIRONMENT=development
```

### Cambios en frontend no se reflejan en producción

**Causa:** No se recompiló el frontend

**Solución:**
```bash
make down
cd frontend
npm run build
cd ..
make prod
```

### Error "network mapalab-network not found"

**Solución:**
```bash
docker network create mapalab-network
```

## Roadmap

Version actual: **v0.9.9** — Camino a v1.0.0 (Marzo 2026)

Ver roadmap completo con timeline en [docs/roadmap.md](docs/roadmap.md).

## Analytics

Eventos GTM/GA4 enviados a `window.dataLayer`. En desarrollo se muestran en un panel de debug flotante.

Ver tabla completa de eventos en [docs/analytics.md](docs/analytics.md).

## Arquitectura

Ver diagramas de infraestructura, flujo de red y componentes en [docs/arquitectura.md](docs/arquitectura.md).

## Licencia

Desarrollado por el equipo del IIEG.
