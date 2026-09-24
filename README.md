# MapaLab

Interfaz web para la creacion, gestion y visualizacion de mapas interactivos
con datos geoespaciales del IIEG Jalisco.

**Version:** 1.198.0

## Requisitos

- Docker >= v28.2.2
- Docker Compose >= v2.36.2
- Git >= 2.48

## Inicio rapido

### 1. Clonar y configurar

```bash
git clone <repo-url>
cd mapalab
cp .env.example .env.development
# Editar .env.development con tus valores (DB, GeoServer, etc.)
```

### 2. Desarrollo

```bash
make up
# Frontend (Vite):  http://localhost:5173
# Backend API:      http://localhost:8001
# Backend Docs:     http://localhost:8001/docs
```

### 3. Produccion

```bash
cp .env.example .env.production
# Editar .env.production con los valores del entorno
make deploy
# App: http://localhost:3006
```

## Comandos disponibles

| Comando | Descripcion |
|---------|-------------|
| `make up` | Levantar sin reconstruir (Vite + Backend hot-reload) |
| `make deploy` | Produccion con `.env.production`: git pull + down + build + up (usado por CD) |
| `make down` | Detener lo que este levantado |
| `make clean` | Detener servicios y limpiar todo |
| `make status` | Ver estado de los servicios |
| `make logs` | Ver logs, con selector de servicio |
| `make setup-hooks` | Configurar git hooks del proyecto |

## Variables de entorno

Ver `.env.example` para la referencia completa de todas las variables.

Las variables se organizan en secciones:
- **General:** `NETWORK_NAME`
- **Frontend:** Variables `VITE_*`, puertos, proxies de desarrollo
- **Backend:** Entorno, base de datos, GeoServer, CORS
- **Nginx:** Puerto (solo produccion)

**Nota:** La base de datos PostgreSQL y GeoServer son servicios **externos**, no gestionados por este repo. Configurar sus conexiones en las variables de entorno.

## Arquitectura

### Desarrollo (`make up`)

```
Browser --> Vite Dev Server (:5173) --> proxy /api --> Backend Uvicorn (:8001)
                                    --> proxy /geoserver --> GeoServer (:8080)
```

- Frontend con hot-reload via Vite
- Backend con `--reload` via Uvicorn en `network_mode: host`
- GeoServer externo (no gestionado por este repo)

### Produccion (`make deploy`)

```
Browser --> Nginx (:3006) --> /       --> Frontend estaticos (dist/)
                          --> /api/   --> Backend Gunicorn (:8000)
```

- Nginx sirve estaticos del frontend con cache (`immutable` para assets, `no-cache` para index.html)
- Proxy reverso a backend en red Docker interna
- GeoServer manejado por gateway externo en produccion

## Stack tecnologico

- **Frontend:** React 19, Vite 8, Tailwind CSS 4, OpenLayers
- **Backend:** FastAPI, SQLModel, PostgreSQL
- **Infra:** Docker, Nginx, GeoServer (externo)

## Estructura del proyecto

```
mapalab/
├── docker-compose.yml          # Servicios unificados con profiles (dev/build/prod)
├── docker-compose.override.yml # Overrides de desarrollo (network_mode: host)
├── .env.example                # Template de variables de entorno
├── Makefile                    # Orquestador de comandos
├── frontend/                   # React + Vite
│   ├── Dockerfile.dev          # Imagen dev (Vite dev server)
│   ├── Dockerfile              # Imagen prod (multi-stage build)
│   └── src/                    # Codigo fuente React
├── backend/                    # FastAPI + SQLModel
│   ├── Dockerfile              # Imagen con targets (development/production)
│   └── app/                    # Codigo fuente Python
│       ├── server.py           # Punto de entrada FastAPI
│       ├── config.py           # Configuracion y variables de entorno
│       ├── routers/            # Endpoints de la API
│       ├── schemas/            # Modelos Pydantic/SQLModel
│       ├── services/           # Logica de negocio
│       └── databases/          # Conexiones a bases de datos
└── nginx/                      # Reverse proxy (prod)
    ├── Dockerfile
    └── nginx.conf
```

### Frontend - Aliases de importacion

| Alias | Ruta |
|-------|------|
| `@components` | `src/components` |
| `@mapsComponents` | `src/pages/maps/components` |
| `@layouts` | `src/layouts` |
| `@pages` | `src/pages` |
| `@contexts` | `src/contexts` |
| `@providers` | `src/providers` |
| `@hooks` | `src/hooks` |
| `@hooksMaps` | `src/pages/maps/hooks` |
| `@services` | `src/services` |
| `@constants` | `src/constants` |
| `@helpers` | `src/helpers` |
| `@icons` | `src/assets/icons` |
| `@logos` | `src/assets/logos` |
| `@png` | `src/assets/png` |
| `@assets` | `src/assets` |

### Backend - Endpoints principales

- `GET /` - Informacion de la API
- `GET /health` - Estado de salud del servicio
- `GET /docs` - Swagger UI (solo en desarrollo)
- `GET /redoc` - ReDoc (solo en desarrollo)

## Testing

```bash
# Tests frontend
cd frontend && npm run test -- --run

# Tests con UI visual
cd frontend && npm run test:ui

# Cobertura
cd frontend && npm run test:coverage

# Lint
cd frontend && npm run lint
```

## Desarrollo local sin Docker

### Frontend

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
# Vite lee las variables VITE_* desde .env.development via docker-compose
# Para correr sin Docker, crear frontend/.env con las variables VITE_* necesarias
```

### Backend

```bash
conda create -n mapalab-backend python=3.12 -y
conda activate mapalab-backend
cd backend
pip install -r requirements.txt
# Crear backend/.env con las variables necesarias (ver .env.example)
uvicorn app.server:app --reload --host 0.0.0.0 --port 8000
# http://localhost:8000/docs
```

## CI/CD

Pipeline automatizado con GitHub Actions. Al hacer push a `develop`, se ejecutan tests, se crea un PR a `production` con auto-merge, y al mergearse se despliega automaticamente via SSH con health check y notificacion a Discord.

```
push a develop -> tests -> PR a production -> auto-merge -> deploy -> health check -> Discord
```

Ver documentacion completa en [docs/ci-cd.md](docs/ci-cd.md).

## Documentacion

| Documento | Descripcion |
|-----------|-------------|
| [Guia de contribucion](docs/CONTRIBUTING.md) | Flujo de trabajo, convenciones de commits y codigo |
| [Registro de cambios](docs/CHANGELOG.md) | Historial de cambios del proyecto |
| [Codigo de conducta](docs/CODE_OF_CONDUCT.md) | Normas de participacion |
| [Backend - detalles tecnicos](docs/backend.md) | Estructura, endpoints, desarrollo local |
| [Testing](docs/testing.md) | Inventario de tests, guia y ejemplos con Vitest |
| [Esquema de z-index](docs/z-index.md) | Capas del mapa y componentes de UI |
| [Periodicidad](docs/periodicidad.md) | Filtrado temporal: periodicidad vectorial/raster |
| [CI/CD](docs/ci-cd.md) | Pipeline de integracion y despliegue continuo |
| [Pendientes y planes](https://github.com/iieg-oficial/context-ame-esta/tree/main/repos/mapalab) | Roadmap, pendientes y planes abiertos (repositorio central de contexto) |
| [Analytics](docs/analytics.md) | Eventos GTM/GA4 y KPIs |
| [Arquitectura](docs/arquitectura.md) | Diagramas de infraestructura y componentes |
| [Zoom](docs/zoom.md) | Zoom automatico por capa, rango de visibilidad y boton centrar Jalisco |
| [Markers](docs/markers.md) | Marcadores temporales con icono en el mapa |
| [URL sync](docs/url-sync.md) | Sincronizacion bidireccional de estado con query params |
| [Busqueda](docs/search.md) | Sistema de busqueda: scoring, searchMeta, backend planeado |
| [Sider](docs/sider.md) | Sidebar: estados, lockMode, hover y menus flotantes |

## Licencia

Desarrollado por el equipo del IIEG.

## UX/UI
[Maqueta](https://xd.adobe.com/view/1c2021ab-ac59-4986-9d45-b35a21656f42-4973/grid)
