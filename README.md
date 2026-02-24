# MapaLab

Proyecto MapaLab del Instituto de Información Estadística y Geográfica del Estado de Jalisco (IIEG).

## Arquitectura

El proyecto está diseñado con **desarrollo y producción**:

### MODO DESARROLLO

![Application](https://img.shields.io/badge/Application-MAPALAB-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-0.9.7-yellow?style=for-the-badge)
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

### 🚀 v1.0.0 — Camino a producción

#### v0.1.0 — Noviembre 2025
- [x] Estructura base del proyecto (monorepo con frontend, backend, nginx)
- [x] Configuración de Docker y Docker Compose (desarrollo y producción)
- [x] Makefile con comandos para dev y prod

#### v0.5.0 — Diciembre 2025
- [x] Visor de mapas con OpenLayers
- [x] Integración con GeoServer (WMS/WFS)
- [x] Backend FastAPI con conexión a PostgreSQL

#### v0.7.0 — Enero 2026
- [x] Sidebar de capas con categorías y subcategorías
- [x] Panel de capas activas con controles de visibilidad
- [x] Modal de detalle de capa con metadatos y descarga

#### v0.9.5 — Febrero 2026
- [x] Capas base y límites municipales configurables
- [x] InfoBox con información de features al hacer clic
- [x] Periodicidad dinámica en capas raster
- [x] Sección de preguntas frecuentes
- [x] Exportación del mapa visible (JPG, PNG, PDF)

#### v0.9.7 — Febrero 2026
- [x] Google Analytics (integración y eventos clave)
- [x] SEO (metatags, Open Graph, sitemap.xml, heading structure)

#### v0.9.9 — Marzo 2026
- [ ] Creación de tests unitarios y de integración
- [ ] CI/CD con GitHub Actions (lint, build, deploy automático)

#### v1.0.0 — Marzo 2026
- [ ] Deploy a producción (servidor IIEG)
- [ ] Pruebas finales en entorno productivo
- [ ] Documentación de despliegue

---

### 🛠️ v1.x — Consolidación y mejoras

#### v1.1.0 — Abril 2026
- Migrar lista de capas del sidebar a endpoint del backend
- Endpoint de búsqueda de capas desde backend

#### v1.2.0 — Mayo / Junio 2026
- Herramienta para comparar periodicidad de mapas (vista lado a lado)

#### v1.3.0 — Julio / Agosto 2026
- Modo edición de Home integrado al administrador de portal
- Compartir estado del mapa vía URL (para el componente comparar, ademas de agregar orden de capas, opacidad, etc)

#### v1.4.0 — Septiembre / Octubre 2026
- Sistema de login para cuidadanos
- Guardar compartidos
- Sistema de capas favoritas por usuario

#### v1.5.0 — Noviembre 2026 / Enero 2027
- Arquitectura de capas para agilizar integración de otras dependencias
- Optimización de carga inicial y lazy loading de componentes

---

### 🔮 v2.0.0 — MapaLab Platform (Febrero 2027+) (Propuestas)

- Integración con IGIBot (AgencIA)
- Visualización 3D de terreno y datos volumétricos
- Generador de dashboards personalizados con indicadores geoespaciales
- API pública documentada para consumo externo de datos
- Análisis espacial interactivo (buffers, intersecciones, estadísticas por zona)
- Modo colaborativo en tiempo real para edición de mapas temáticos
- Importación de datos externos (Shapefile, GeoJSON, KML, CSV)
- Embebido de mapas en sitios externos (iframe / widget)
- Sistema de roles y permisos (administrador, editor, visualizador)
- PWA con soporte offline para consulta en campo
- Sistema de notificaciones (nuevas capas, actualizaciones de datos)
- Generación automatizada de reportes geoespaciales

## Analytics — Eventos GTM/GA4

Los eventos se envían a `window.dataLayer` para ser consumidos por GTM. En desarrollo se muestran en el panel de debug flotante (esquina inferior izquierda).

> **Integración:** El portal `iieg.jalisco.gob.mx` debe tener GTM instalado con un tag GA4 configurado para escuchar estos eventos desde `dataLayer`.

| Evento | Parámetros | Qué mide | Dónde se dispara | KPI |
|---|---|---|---|---|
| `map_interaction` | `action` | Conteo total de interacciones en el mapa | Acompaña a cada evento de mapa | Número de visitas / Tasa de interacción |
| `layer_toggle` | `layer_id`, `action: activate\|deactivate` | Capas más populares y frecuencia de uso | Al activar o desactivar una capa | Capas más activadas |
| `feature_click` | `layer_id` | Consultas de información por capa | Al hacer clic en el mapa y obtener resultados | Interacción de clics en el mapa |
| `map_zoom_level` | `zoom_level` | Nivel de zoom usado (botones +/-) | Al pulsar zoom in / zoom out | Interacción de clics en el mapa |
| `layer_search` | `query` | Términos buscados con resultados exitosos | Al buscar una capa con coincidencias | Consultas de búsqueda orgánica |
| `layer_detail_open` | `layer_id` | Capas cuyo detalle/metadata se consulta | Al abrir el modal de detalle de capa | Profundidad de desplazamiento |
| `layer_download` | `layer_id` | Descargas de datos espaciales por capa | Al descargar el ZIP de una capa con éxito | Descargas |
| `map_export` | `format: png\|jpeg\|pdf` | Exportaciones de mapa por formato | Al confirmar exportación en el panel | Descargas / Uso de herramientas |
| `raster_loop_start` | `layer_id` | Uso de animación temporal raster | Al iniciar el loop en capas de precipitación/temperatura | Uso de herramientas / Filtros |
| `raster_loop_stop` | `layer_id` | Duración implícita de uso del loop | Al detener el loop | Uso de herramientas |
| `drawing_tool_use` | `tool: LineString\|Polygon\|Freehand\|Text\|Emoji` | Herramientas de dibujo/medición utilizadas | Al seleccionar una herramienta en el panel de dibujo | Uso de herramientas |
| `basemap_change` | `basemap_id` | Preferencia de mapa base de los usuarios | Al cambiar el mapa base | Interacción de clics en el mapa |
| `geolocate` | `status: success\|error` | Uso de geolocalización y tasa de error | Al pulsar el botón de ubicación | Uso de herramientas |
| `periodicity_advanced` | `layer_id` | Uso del selector de fechas avanzado por capa | Al activar modo avanzado de periodicidad (doble clic o pulsación larga) | Uso de herramientas / Filtros |
| `sider_lock` | `mode: expanded\|collapsed\|auto` | Preferencia de fijación del menú lateral | Al cambiar el modo de bloqueo del sider (clic o Alt+B) | Interacción de clics en el mapa |

### Debug en desarrollo

En `VITE_NODE_ENV=development` aparece un panel flotante en la esquina inferior izquierda que muestra cada evento disparado con sus parámetros y hora. Los eventos **no se envían a GA4** en este modo.

En producción el panel no renderiza y los eventos van a `window.dataLayer` para GTM.

---

## Licencia

Desarrollado por el equipo del IIEG.
