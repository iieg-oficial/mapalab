# Contexto del Proyecto MapaLab

Interfaz web para la creacion, gestion y visualizacion de mapas interactivos con datos geoespaciales del IIEG Jalisco. Este documento sirve como referencia completa para entender el proyecto sin necesidad de contexto previo.

## Stack

| Componente | Tecnologia |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 4, OpenLayers 10, React Router 7 |
| Backend | FastAPI, Gunicorn + Uvicorn (8 workers async), SQLAlchemy, Python 3.12 |
| Base de datos | PostgreSQL 18 + PostGIS 3.6 (externa, no gestionada por este repo) |
| GeoServer | 2.27.0 Kartoza (WMS, WFS, WCS — externo) |
| Proxy | Nginx stable-alpine |
| Contenedores | Docker + Docker Compose con profiles (dev, staging, build) |
| Testing | Vitest + Testing Library (ver `docs/testing.md`) |
| CI/CD | GitHub Actions (lint, test, deploy SSH, health check, Discord) |
| Monitoreo | Huachicol (Grafana + Prometheus + Loki) |

## Ecosistema IIEG

MapaLab opera dentro de una infraestructura compartida en GCP con multiples servicios interconectados via Docker network (`iieg-network`).

### Entornos de infraestructura

| Entorno | Infra | Descripcion |
|---|---|---|
| Local | Docker en maquina del desarrollador | `make dev` con Vite + Uvicorn, proxy a GeoServer via Vite |
| GCP (staging) | 1 VM: 2 cores, 7.8 GB RAM, 145 GB disco | Todos los contenedores en el mismo servidor, CI/CD automatico desde `production` branch |
| Administracion (produccion) | 4 servidores dedicados | Gestionado por otra dependencia, no tenemos acceso directo a la consola GCP. Cambios de infra se solicitan al equipo administrador |

#### Servidores de produccion

| Servidor | CPU | RAM | Disco | Servicios |
|---|---|---|---|---|
| S1: Gateway + Huachicol + Acervo | 8 cores | 15 GB | 637 GB | Nginx gateway, Prometheus, Grafana, Loki, MinIO |
| S2: MapaLab | 4 cores | 7.7 GB | 96 GB | Nginx + Gunicorn backend |
| S3: GeoServer | 8 cores | 15 GB | 490 GB | GeoServer (WMS/WFS/WCS) |
| S4: DataEngine | 4 cores | 7.7 GB | 490 GB | PostgreSQL 18 + PostGIS 3.6 |

Documentacion completa de recursos en `/IIEG/gateway-hub/docs/recursos-servidores.md`.

### Servicios y conexiones

```
gateway-hub (Nginx central)
├── /mapalab/     → mapalab-nginx (este proyecto)
├── /geoserver/   → GeoServer (WMS/WFS/WCS, cache 6h, proteccion de bots)
├── /acervo/      → MinIO (almacenamiento S3, metadatos de capas)
├── /api/         → Portal IIEG (FastAPI)
├── /             → Portal frontend
├── /huachicol/   → Grafana (solo VPN)
└── /mariachi/    → Analytics (solo VPN)
```

### gateway-hub

Reverse proxy central que maneja:
- SSL/TLS termination (unico punto HTTPS)
- Inyeccion de GTM via `sub_filter` en Nginx (el frontend NO inyecta GTM)
- Control de SEO via `SEO_ENABLED`: produccion permite indexacion, staging la bloquea (robots.txt, sitemap, X-Robots-Tag). MapaLab no gestiona SEO — se controla desde gateway
- Rate limiting por zonas: `general` (10r/s), `api` (10r/s), `static` (50r/s). Responde 429 al exceder
- Cache de assets de MapaLab (500MB, 7 dias, stale serving en errores)
- Cache de GeoServer (2GB, 6h TTL)
- Paginas de error personalizadas (400, 401, 403, 404, 429, 500)
- Logs JSON a Loki via Promtail

Ruta `/mapalab/assets/` tiene rate limit separado (zona `static`, burst 200) y cache a nivel gateway.
Los assets con hash de Vite se sirven como `immutable` con cache de 1 año.

Configuracion clave en `/IIEG/gateway-hub/`:
- `nginx/templates/gateway.conf.template` — todas las reglas de ruteo
- `nginx/includes/geoserver-locations.inc` — cache y proteccion de GeoServer
- `docs/rendimiento.md` — configuracion de rate limiting, cache y capacidades
- `.env` — direcciones de upstreams (MAPALAB_HOST, GEOSERVER_HOST, etc.)

### GeoServer

Servidor OGC que provee capas geoespaciales. MapaLab consume WMS/WFS/WCS.
- Frontend hace requests a `/geoserver/` (proxy via gateway-hub en prod, via Vite en dev)
- Backend usa `GEOSERVER_URL` directamente para consultas REST
- Datos vienen de PostgreSQL/PostGIS (dataengine)
- 10 workspaces: `general`, `economia`, `salud`, `educacion`, `seguridad`, `recursos`, `demografia`, `desarrollo`, `gobierno`, `raster`
- 4 workspaces con alias: `seguridad` → `seguridad_y_proteccion_ciudadana`, `gobierno` → `gobierno_y_ciudadania`, `desarrollo` → `desarrollo_social`, `recursos` → `recursos_y_calidad_de_vida`

### dataengine

Cluster PostgreSQL 18 + PostGIS 3.6 con primary (5432) + replica (5433) + backups automaticos a Acervo.
- GeoServer lee datos espaciales de aqui
- Backend de MapaLab consulta `mapalab.layer_metadata` + `mapalab.layer_stats` (esquema `mapalab`) para metadatos y numeralia
- Download service hace `COPY TO STDOUT` para exportar CSV; resuelve `layer_name_db` desde `mapalab.layer_metadata`
- Container `dataengine-jobs` corre cron diario (periodicity, layer_tree, layer_stats)

### Acervo (MinIO)

Almacenamiento S3-compatible. MapaLab usa el bucket `mapalab` para:
- Metadatos de capas en `/mapalab/metadata/txt/` y `/mapalab/metadata/xlsx/`
- URLs publicas via `ACERVO_PUBLIC_URL`

## Estructura del proyecto

```
mapalab/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── main.jsx       # Entry point, router, providers
│   │   ├── pages/
│   │   │   ├── home/      # Landing page
│   │   │   └── maps/      # Visor de mapas (pagina principal)
│   │   │       ├── components/   # MapView, MapSider, InfoBox, ActiveLayers, etc.
│   │   │       ├── hooks/        # 28 hooks especializados del mapa
│   │   │       └── helpers/      # wmsConfig, basemaps, menuItems, etc.
│   │   ├── components/    # Componentes compartidos (Modal, Panel, Alert, etc.)
│   │   ├── contexts/      # MapsContext, SiderContext, LayerLoadingContext, SearchContext
│   │   ├── providers/     # MapsProvider (orquestador central), MainProvider
│   │   ├── services/      # downloadService, featureInfoService, analyticsService, etc.
│   │   ├── hooks/         # Hooks globales (useDebounce, useMaps, etc.)
│   │   └── test/          # Tests con Vitest (ver docs/testing.md)
│   ├── Dockerfile         # Build de produccion (Node 24 Alpine)
│   └── Dockerfile.dev     # Dev con hot-reload
├── backend/
│   └── app/
│       ├── server.py      # FastAPI, CORS, lifespan, leader-follower locking
│       ├── config.py      # Settings desde env vars
│       ├── routers/       # metadata, periodicity, download
│       ├── services/      # periodicity_service (refresh diario 3AM), scheduler
│       ├── repositories/  # mapalab_repository, download_repository
│       ├── models/        # Mapalab_Card (SQLAlchemy)
│       └── databases/     # Connection pooling, factory pattern
├── nginx/
│   ├── nginx-main.conf    # Config principal: workers auto, connections 2048, open_file_cache
│   ├── nginx.conf         # Server block: proxy a backend (keepalive 32), SPA routing, gzip, cache
│   └── Dockerfile
├── docker-compose.yml     # Profiles: dev, staging, build
├── Makefile               # dev, staging, prod, deploy, ensure-networks
├── .env.example           # Template de variables
├── .github/workflows/     # ci, cd, auto-merge, commit-lint, test-frontend
└── docs/                  # arquitectura, ci-cd, testing, analytics, roadmap, etc.
```

## Arquitectura del frontend

### Jerarquia de providers

```
Router (React Router 7)
└── MainProvider (SearchProvider)
    └── MapsProvider (estado central del mapa)
        ├── useLayerManagement    — IDs de capas activas, lookup en arbol
        ├── useSymbology          — visibilidad, hiddenLayerIds
        ├── useLayerOpacity       — opacidad por capa
        ├── useCQLFilter          — filtros CQL por capa
        ├── useDateLoop           — animacion temporal (raster y vectorial)
        ├── useMapDrawing         — herramientas de dibujo/medicion
        ├── useMapEditing         — edicion en-mapa de emojis y texto
        ├── usePeriodicityCache   — cache de fechas disponibles
        └── EventoProvider (envuelve children, requiere allLayers de MapsContext)
            ├── useEventos              — fetch + watcher de versiones
            ├── useEventoLayerIndex     — Map plano workspace|layer→node + eventoByLayerId
            └── activeEvento + setter   — evento abierto en el menu
```

`EventoContext` es un sub-contexto separado del `MapsContext` para aislar rerenders: cambios en `activeEvento` o en la lista de eventos no fuerzan a rerender todo el árbol del visor. Acceso vía `useEventoContext()` en `hooks/useEvento.js`.

### Ciclo de vida de capas WMS

1. Usuario activa capa en menu → `onToggleLayer(id)` agrega a `activeLayerIds`
2. `useLayerToggle` aplica `defaultDate` si la capa lo tiene configurado
3. `useWMSLayerManager` detecta cambio → agrupa capas por `baseUrl|wmsGroup`
4. Crea `TileWMS` de OpenLayers con parametros mergeados (LAYERS, STYLES, CQL_FILTER)
5. `useWMSFilterUpdater` actualiza parametros WMS cuando cambian filtros
6. `useUrlSync` persiste estado en URL: `?layers=id1,id2,*selected&filter_id=cql`

### Filtros CQL

- Estado: `filters[layerId][filterName] = cqlExpression`
- Multiples filtros por capa se combinan con AND
- Filtros se heredan de padre a hijo en la jerarquia
- Claves con prefijo `_` son internas (excluidas de combinacion CQL)
- Capas con `timeEnabled` usan parametro TIME de WMS en lugar de CQL_FILTER

### Definiciones de capas

Definiciones viven en DataEngine (schema `mapalab`). Frontend las carga via `GET /mapalab/api/layers/tree` en `LayersProvider`. El editor vive en mariachi `/administrador/mapalab/layers`. Ver `docs/layers.md` para detalles.

### URL sync bidireccional

- `useInitializeFromUrl` — al montar, parsea `?layers`, `?filter_*`, activa capas y aplica filtros
- `useUrlSync` — debounced 500ms, actualiza URL cuando cambian capas/filtros/seleccion
- Formato: `?layers=id1,id2,*selectedId&filter_layerId=cqlExpression`

## API del backend

### Endpoints

| Metodo | Ruta | Funcion |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/metadata/?workspace=X&layer=Y` | Metadata de capa. Lee exclusivamente de `mapalab.layer_metadata` + `mapalab.layer_stats` (fallback legacy eliminado en v1.7.0) |
| GET | `/metadata/sources?layers=w:l,w:l` | Fuentes por lotes |
| GET | `/metrics` | Métricas Prometheus (v1.7.0+) |
| GET | `/periodicity/?workspace=X&layer=Y` | Fechas disponibles (estructura year/month/day) |
| GET | `/periodicity/batch?layers=w:l,w:l` | Periodicidad por lotes |
| GET | `/download/{workspace}/{layer}?date_from&date_to` | CSV streaming via PostgreSQL COPY |
| GET | `/layers/tree` | Árbol jerárquico de capas (ETag, lee de `mapalab.layer_tree_cache`) |
| GET | `/layers/initial-order` | Capas activas al cargar |
| GET | `/layers/workspaces` | Lista de workspaces |
| GET | `/layers/search?q=X` | Búsqueda flat con path |
| POST | `/layers/refresh-cache` | Regenera cache materializada (invocable desde mariachi) |
| POST | `/layers/invalidate-cache` | Invalida solo caché en memoria del proceso |
| ANY  | `/mcp/` | Servidor MCP (FastMCP). Expone `metadata`, `periodicity`, `layers` y `shares` como tools. Excluye `download` y `metrics`. Transporte HTTP streamable; nginx lo proxea sin buffering ni cache |

### MCP server

Construido con `FastMCP.from_fastapi(...)` a partir de un sub-app FastAPI que registra sólo los routers que se quieren exponer como tools (`metadata`, `periodicity`, `layers`, `shares`). El sub-app **no** comparte instancia con `app` para que `download` y `metrics` queden fuera del MCP sin perderlos del REST.

- Montaje: `app.mount("/mcp", mcp_app)` en `backend/app/server.py`. URL externa: `/api/mcp/` (vía nginx) o `/mapalab/api/mcp/` (vía gateway-hub).
- Lifespan: `combine_lifespans(lifespan, mcp_app.lifespan)` preserva el warmup del pool, el leader election y el scheduler existentes.
- Nginx: `location /api/mcp/` con `proxy_buffering off`, `proxy_cache off` y timeouts de 600s para el transporte HTTP streamable.
- Auth: por ahora público (mismo perfil que el resto del backend). Si se requiere restringir, hacerlo en gateway-hub via allowlist o header secret.

### Modelos y tablas DataEngine (schema `mapalab` + legacy `public`)

**Fuente única (v1.4.0+):**
- `mapalab.layers` — árbol jerárquico (250 nodos, editado por mariachi)
- `mapalab.workspaces` — alias + geoserver_workspace + db_schema
- `mapalab.initial_layer_order` — capas al cargar
- `mapalab.layer_tree_cache` — JSON materializado del árbol (singleton, refresh diario)
- `mapalab.layer_metadata` — descripción, fuentes, metodología, downloadable
- `mapalab.layer_stats` — stats_config (queries) + values cacheadas + pie_numeralia (refresh diario)

**Auxiliar:**
- `public.layer_periodicity` — tabla autogenerada por función SQL (refresh diario)

**Legacy (eliminado en v1.7.0):**
- `public.mapalab_card` — ya no se lee desde el backend. La tabla puede seguir viva en producción como respaldo histórico hasta que se confirme que todo está migrado a `mapalab.layer_metadata`. El ETL del Google Sheet fue eliminado del código de runtime; se restaura temporalmente desde git (commit `1f70a88~1`) en el flujo `make prod-migration` de `dataengine`, que hace el pull final del Sheet + bootstrap + seed + migrate + stamp en una sola invocación.

### Schedulers (viven en DataEngine, no en mapalab backend)

Container `dataengine-jobs` corre cron con tres tareas diarias:

| Hora | Job | Qué hace |
|---|---|---|
| 03:00 | `run_refresh_periodicity.py` | Invoca `SELECT public.refresh_layer_periodicity()` |
| 04:00 | `run_refresh_layer_tree.py` | Reconstruye `mapalab.layer_tree_cache` desde `layers` |
| 04:30 | `run_refresh_layer_stats.py` | Ejecuta los SQL de `stats_config` y guarda en `values` |

Trigger manual desde cualquier repo: `make refresh-layer-tree`, `make refresh-layer-stats`, `make refresh-all` (en dataengine).

Mariachi invoca `POST /mapalab/api/layers/refresh-cache` al aprobar borradores o editar capas para refresh inmediato.

### Leader-follower

Desde v1.4.0 el scheduler ya no corre en mapalab backend (lo hace `dataengine-jobs`). El leader-follower de `server.py` se conserva para `PeriodicityService.ensure_schema()`: crea idempotentemente la tabla `public.layer_periodicity` y la función SQL `public.refresh_layer_periodicity()` en la BD de mapalab, y dispara el primer refresh si la tabla está vacía. El cron de `dataengine-jobs` (03:00) sólo invoca la función ya creada.

### Connection pool

Pool SQLAlchemy configurable via variables de entorno `DB_POOL_SIZE` y `DB_MAX_OVERFLOW`. Workers de Gunicorn configurables via `GUNICORN_WORKERS`.

| Entorno | Workers | Pool size | Max overflow | Total conexiones DB |
|---|---|---|---|---|
| Produccion (4 cores) | 8 | 8 | 8 | 128 max |
| GCP staging (2 cores) | 4 | 4 | 4 | 32 max |

DataEngine tiene `max_connections=200`.

## Descargas

El frontend maneja tres tipos de descarga:

| Tipo | Mecanismo | Formatos |
|---|---|---|
| Vector | WFS GetFeature | GeoPackage (EPSG:6368), Shapefile (EPSG:4326), CSV |
| Raster | WCS GetCoverage | GeoTIFF |
| CSV (backend) | PostgreSQL COPY | CSV con filtro de fechas |

Las descargas pueden incluir metadatos (TXT, XLSX) empaquetados en ZIP.

Timeouts de descarga (600s) configurados en:
- mapalab nginx: `/api/download/` (backend CSV)
- gateway-hub: `/mapalab/api/download/` (backend CSV), `/geoserver/{workspace}/(wfs|wcs)` (WFS/WCS por workspace), `/geoserver/(wfs|wcs)` (WFS/WCS directo)

## Capas raster/temporales

- Capas con `timeEnabled: true` usan parametro TIME de WMS (no CQL_FILTER)
- `timeStylePattern` permite estilos dinamicos por fecha: `lluvia_total_mensual_{year}_{month}`
- `useDateLoop` (antes `useRasterLoop`) anima ciclando valores CQL/TIME con modo `year`/`month`, intervalo configurable (presets 250-3000ms, clamp 100-10000ms) y dirección LTR/RTL; funciona para capas raster y vectoriales
- Cada capa raster tiene `wmsGroup` unico para evitar merge de requests WMS

## Docker y despliegue

### Profiles

| Profile | Servicios | Uso |
|---|---|---|
| `dev` | frontend (Vite :5173) | Desarrollo con hot-reload |
| `build` | frontend-build | Genera `dist/` para produccion |
| `staging` | backend + nginx | Produccion/staging |

### Makefile

| Comando | Accion |
|---|---|
| `make dev` | Levanta desarrollo (Vite + Uvicorn) |
| `make staging` | Build frontend + Nginx + Gunicorn |
| `make prod` | Staging con `.env.production` |
| `make deploy` | ensure-networks + build + up --force-recreate |
| `make down` | Detiene todos los servicios |
| `make clean` | Detiene + limpia volumenes y dist |

### Redes Docker

- `mapalab-network` — red interna del compose (default)
- `iieg-network` — red externa compartida con gateway-hub (creada por `ensure-networks`)

### Variables de entorno clave

**Frontend (Vite):**
- `VITE_BACKEND_API_HOST` — ruta relativa al backend (`/api/` o `/mapalab/api/`)
- `VITE_GEOSERVER_URL` — ruta relativa a GeoServer (`/geoserver/`)
- `VITE_BASE_PATH` — base path del SPA (`/` en dev, `/mapalab/` en prod)
- `VITE_NODE_ENV` — `development`|`production` (controla debug panels)
- `VITE_APP_ENV` — `dev`|`beta` (controla modal de pruebas y badge)
- `GEOSERVER_DEV_TARGET` / `BACKEND_DEV_TARGET` — targets del proxy de Vite (solo dev)

**Backend:**
- `GEOSERVER_URL` — URL directa a GeoServer
- `GEOSERVER_USER` / `GEOSERVER_PASSWORD` — credenciales GeoServer
- `DB_*` — conexion a PostgreSQL
- `ACERVO_PUBLIC_URL` — URL publica para metadatos

## CI/CD

```
Push a develop → CI (lint + test) → Auto PR a production → Auto-merge
Push a production → CD: test → deploy SSH (make deploy) → health check → Discord
```

- Branch principal de desarrollo: `develop`
- Branch de produccion: `production`
- Conventional commits obligatorios
- Deploy via SSH al servidor GCP ejecutando `make deploy`

## Analytics

Eventos se envian a `window.dataLayer` para consumo por GTM (inyectado por gateway-hub). En desarrollo aparece un panel de debug flotante. Eventos principales: `layer_toggle`, `feature_click`, `map_zoom_level`, `layer_search`, `layer_download`, `map_export`, `raster_loop_start/stop`, `drawing_tool_use`, `basemap_change`, `share_map`, `report_submitted`, `evento_open`, `evento_close`.

## Telemetría propia → Mariachi (v1.27.0+)

En paralelo a GA4, el visor emite los mismos eventos a un collector propio en Mariachi para tener SQL libre y dashboards internos sin depender de Google.

- **`services/telemetryService.js`**: buffer en memoria con flush cada 30s o 50 eventos. `navigator.sendBeacon` en `pagehide` para no perder eventos al cerrar la pestaña. Session UUID en `sessionStorage` con expiración de 4h. Heartbeat cada 60s con `document.visibilityState === 'visible'` para calcular duración real. Honra Do-Not-Track del navegador.
- **`services/analyticsService.js`**: inyecta `telemetry.enqueue` en el `trackEvent` central. Todos los trackers existentes emiten a ambos lados (dataLayer + collector propio) sin tocar componentes.
- **Trackers nuevos**: `trackThemeChange`, `trackOpacityChange`, `trackLegendsToggle`, `trackSwipeEnter/Exit/SlotChange`, `trackInfoBoxAction`, `trackHomeAction`, `trackContributeClick`, `trackLogoClick`, `trackLayerReorder`, `trackMeasurementTool`, `trackEmbedView`.
- **Persistencia**: `POST /api/public/mapalab/events/batch` en Mariachi (rate limit 120/min/IP). Acepta lotes de hasta 100 eventos. Scrubbing PII con el mismo `pii_scrubber` que usa Colibri. Hash de IP con salt diario, sin identidad.
- **Variables de entorno**:
  - `VITE_MARIACHI_PUBLIC_API_HOST` — base URL del endpoint público (default `/api/public/` cuando ambos viven detrás del mismo gateway)
  - `VITE_TELEMETRY_ENABLED` — `'false'` para desactivar el collector (GA4 sigue funcionando)
- **Dashboards**: panel admin en mariachi (`/mariachi/mapalab/stats`) consume vistas materializadas refrescadas cada 30 min.

## Reportes ciudadanos

Sistema transversal de reportes (problemas, solicitudes, sugerencias, dudas, datos incorrectos, bugs) que vive en mariachi (modelo `Reporte`, tabla `reportes`). Mapalab solo envia reportes al endpoint publico de mariachi.

- **Frontend**: `components/ReportButton.jsx` + `components/ReportModal.jsx`. Hook `useReportContext` arma `source_app`/`source_route`/`source_context` (app_version, user_agent, screen, basemap, capas activas, vista, swipe). Servicio `services/feedbackService.js` postea a `/api/public/reportes` (variable `VITE_MARIACHI_PUBLIC_API_HOST`, default `/api/public/`).
- **Tres puntos de entrada**: flotante junto a `MapAttribution` en `/mapa` (usa `MapReportButton` que reutiliza `captureElement` de `useMapCapture` para screenshot), inline al pie del `InfoBox` cuando hay feature seleccionada (pasa `feature_id`/`layer_id`/`feature_properties`), inline en Home debajo de los botones de soporte (sin screenshot).
- **Honeypot + screenshot**: campo `website` invisible (descarta bots) y captura opcional via `html2canvas-pro` con `scale: 0.7`. Email opcional → reporte anónimo.
- **Storage del screenshot**: bucket privado `mariachi` con prefijo `reportes/AAAA/MM/<uuid>.png`. URL servida por proxy admin-only.

## Visor embebido (`/embed`) y widget `<iieg-mapalab>`

MapaLab puede insertarse en sitios de otras instituciones a través de un Web Component que monta un iframe del visor. Toda la administración (llaves, sitios autorizados, capas permitidas, mapas guardados, auditoría) vive en mariachi (`/administrador/mapalab/api-keys`).

- **Widget (`widget/`)**: paquete Lit + Vite v1.1.0, bundle ~23 KB / 8.4 KB gzip servido en `/mapalab/widget/v1/mapalab.js`. Atributos `api-key`, `share`, `layers`, `center`, `zoom`, `basemap`, `controls`, `height`, `width`, `base-url`, `title`, `ready-timeout-ms`. Eventos `mapalab:ready`, `mapalab:error`, `mapalab:timeout`, `mapalab:feature-click`. Overlay con botones "Reintentar" + "Abrir mapa en MapaLab" cuando falla validación/timeout. Footer "Fuente: IIEG" como atribución obligatoria.
- **Visor embebido (`frontend/src/pages/embed/`)**: SPA ligero que valida la key contra `/embed/config` antes de montar el mapa. Defense-in-depth contra clickjacking: además de validar Referer en el data path, el visor verifica en cliente que `document.referrer` matchee la allowlist (`dominiosPermitidos` devuelto por config). Si no, muestra `EmbedError` con botones de recuperación.
- **Telemetría**: hook `useEmbedTelemetry` captura LCP, CLS, INP, FCP, TTFB con `web-vitals` + errores JS (`window.onerror` + `unhandledrejection`). Envío via `sendBeacon` con fallback `fetch keepalive`. Métrica adicional `IFRAME_READY` para tiempo de arranque end-to-end. Endpoint `POST /embed/telemetry` registra en histograma Prometheus `mapalab_embed_vital_ms{metric, prefix}` y counter `mapalab_embed_js_errors_total`.
- **Auditoría de accesos**: cada llamada a `/embed/config`, `/embed/wms-proxy` o `/embed/layers/tree` se registra en mariachi (tabla `mapalab_api_keys_accesos`) vía buffer in-memory + flush periódico (30s). Hash de IP con SHA-256 usando `MAPALAB_INTERNAL_TOKEN` como salt. Retención 90 días configurable, purga vía cron de mariachi.
- **Postmessage bidireccional**: el iframe emite `mapalab:viewchange` (admin captura center/zoom en vivo al mover el mapa del preview) y escucha `mapalab:setview` (admin envía vista guardada sin recargar). Throttle 200ms en ambos sentidos, con flag de supresión para evitar feedback loop.
- **Documentación pública**: `docs/widget.md` (contrato del Web Component).
- **Pendientes de gobernanza**: clasificación pública/reservada/confidencial por capa, T&C versionados, linaje hasta dependencia origen, SLA visible "Datos al corte de X" en el footer, notificaciones de cambios estructurales. Backlog formal en `docs/planes/widget-pendientes.md`.

## Proximos pasos (roadmap)

- **v1.4.0 — v1.5.1** — Capas dinámicas desde backend (mariachi CMS + DataEngine schema `mapalab`), security hardening, tests smoke — Abril 2026 ✅
- **v1.6.0** — Selector GeoServer dinámico, edición masiva de tags, rate limiter en memoria — Abril 2026 ✅
- **v1.7.0** — Drag & drop del árbol, preview InfoBox, editor JSON custom, forms dinámicos por preset, `/metrics` Prometheus, code-split admin, drop legacy `mapalab_card` — Abril 2026 ✅
- **v1.14.0 — v1.17.0** — Item de capa activa rediseñado, Reportes ciudadanos, MCP Server — Abril/Mayo 2026 ✅
- **v1.18.0** — Marker IIEG dinámico, swipe robusto, loop controls visibles, logo Mapalab responsive, optimizaciones SEO — Mayo 2026 ✅
- **v1.19.0** — Modal de detalle con identidad del evento — Mayo 2026 ✅
- **v1.20.0** — Auditoría de eventos: perf (cache server-side, index O(1), polling pausado), arquitectura (`EventoContext` separado), persistencia por sesión, telemetría — Mayo 2026 ✅
- **v1.27.0** — Telemetría anónima del visor → Mariachi (sesiones, capas más usadas, herramientas, botones, swipe) — Mayo 2026 ✅
- **v1.21.0** — Editor de Home desde admin, compartir estado completo del mapa via URL — Julio/Agosto 2026
- **v1.22.0** — Login ciudadano, capas favoritas — Septiembre/Octubre 2026
- **v2.0.0** — Arquitectura de capas para dependencias, lazy loading, IGIBot, 3D, dashboards, API publica — Febrero 2027+

Ver `docs/layers.md` para arquitectura de capas y `docs/roadmap.md` para timeline completo.

## Archivos .env por entorno

| Archivo | Proposito |
|---|---|
| `.env.example` | Template con todas las variables (copiar a `.env.development`, `.env.staging`, `.env.production`) |
| `.env.development` | Variables para `make dev` (Vite + Uvicorn local) |
| `.env.staging` | Variables para `make staging` |
| `.env.production` | Variables para `make deploy` / `make prod` |

Docker Compose usa `--env-file` apuntando al archivo correspondiente segun el entorno. Las variables `VITE_*` se pasan al contenedor via `environment` (dev) o `args` (build) en el compose.

## Frontend en produccion es estatico

En produccion no existe un contenedor de frontend corriendo. El flujo es:

1. `frontend-build` (profile `build`) ejecuta `npm run build` y copia `dist/` al host
2. El contenedor muere despues del build
3. Nginx monta `frontend/dist/` como volumen read-only y sirve los archivos estaticos
4. Cualquier cambio de frontend requiere rebuild (`make deploy` lo hace automaticamente)

## Import aliases (Vite)

```
@components    → src/components/
@mapsComponents → src/pages/maps/components/
@pages         → src/pages/
@contexts      → src/contexts/
@providers     → src/providers/
@hooks         → src/hooks/
@hooksMaps     → src/pages/maps/hooks/
@helpers       → src/helpers/
@services      → src/services/
@constants     → src/constants/
@icons         → src/assets/icons/
@logos         → src/assets/logos/
@png           → src/assets/png/
@assets        → src/assets/
@layouts       → src/layouts/
```

Siempre usar estos aliases en imports. Nunca usar rutas relativas como `../../components/`.

## Jerarquia de nodos del arbol de capas

```
tema (raiz: "Seguridad", "General", etc.)
└── category (isCategory: true — carpeta expandible/colapsable)
    └── label (isLabel: true — encabezado de seccion, sin toggle)
        └── leaf (capa con wmsConfig — se renderiza en el mapa)
            └── [opcional] sub-capas con filtro CQL (forceGroup: true — hijos se renderizan como unidad)
```

- `isCategory` → nodo expandible en el menu
- `isLabel` → titulo de seccion sin checkbox
- `forceGroup` → agrupa hijos, no se pueden togglear individualmente
- `hiddenInMenu` → no aparece en menu pero puede estar activa
- `label` con prefijo `*` → capa deshabilitada (opacity 50%, sin toggle)

## Panel de capas activas

Cada item de `<ActiveLayerItem>` tiene un layout vertical de hasta 4 filas, expandidas sólo cuando el item está seleccionado:

1. **Fila 1**: drag handle (sólo visible en seleccionado o hover desktop) + título. En hover de no-activo aparecen los botones rápidos `<LayerInlineActions>` (visible / detalles / eliminar) entre el handle y el título.
2. **Fila 2** (`<LayerDateControls>`): pill de periodicidad + loop controls + `<SlotBadge>`. Usa CSS Grid `grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]` para que el badge quede matemáticamente centrado al medio del item en todos los modos (no-swipe, AB, solo A, solo B). Loop controls (play/intervalo/dirección) sólo aparecen cuando el loop ya está corriendo; para iniciarlo se usa "Ver animación" del `<LayerDetailModal>`.
3. **Fila 3** (`<LayerActionsBar>`): visible / detalles / opacidad / **descargar** / leyendas / `<Switch>` A-B (sólo en swipe AB) / eliminar. Click en el switch dispara `setHighlightedSlots(target)` con timeout de 1.5 s para destacar el panel del swipe correspondiente. El botón descargar reutiliza `useLayerDownload` + `<DownloadMenu>` (mismo flujo que el modal de detalles, no descarga directa); sólo aparece si `metadata.capa_descargable !== false`. El botón leyendas en estado activo usa `bg-white border-[#70308A]`. Tooltips dinámicos en swipe: anexan `del lado A`/`del lado B` y, para acciones destructivas en `AB`, `(seguirá en el lado X)`.
4. **Fila 4** (`<LayerLegendInline>`): GetLegendGraphic lazy con DPI 200 (retina-friendly), `max-w-[220px]`, wrapper estilo `<SymbologyPanel>` (`bg-white rounded-[10px] shadow`). En swipe AB usa el filtro de fecha del `activeSlot`. Visibilidad controlada por toggle global persistido en `localStorage` (`mapalab.activeLayers.legendsVisible`, default `true`). Mientras la imagen carga muestra `<Logo name="mapalab" isLoading />` (Lottie); el contenedor solo aplica `min-h-[40px]` mientras `!isLoaded`.

El botón eliminar del item, en swipe, quita la capa de **ambos** slots (`paneA` + `paneB`); para mover entre slots se usa la pildora A|B. Los badges del header del panel cuentan items unificados (`unifiedLayers.length`) en lugar de IDs internos.

Sub-componentes en `frontend/src/pages/maps/components/ActiveLayers/`:
- `ActiveLayerItem.jsx` — container que orquesta las filas.
- `LayerItemHeader.jsx` — exporta `DragHandle` y `LayerTitle` por separado para permitir reorden.
- `LayerDateControls.jsx` — Fila 2 (pill + loop + badge en grid).
- `LayerActionsBar.jsx` — Fila 3 (acciones del item expandido).
- `LayerInlineActions.jsx` — botones rápidos en hover de no-activo.
- `LayerLegendInline.jsx` — Fila 4 (leyenda WMS inline lazy).
- `LayerOpacityPopover.jsx` — popover del slider de opacidad anclado al botón con `createPortal` + `position: fixed`.
- `hooks/useLegendsVisibility.jsx` — context provider del toggle global de leyendas con persistencia en `localStorage`.

## Modal de detalle de capa

`<LayerDetailModal>` (panel derecho del visor) abre desde el botón de detalles del panel de capas activas o de los menús. El header arriba (`<LayerDetailHeader>`) muestra avatar + título del **tema** de la capa por defecto. Si la capa pertenece a un **evento** (configurado en mariachi), el header sustituye avatar y título por los del evento: prioriza `activeEvento` en `EventoContext` (lo setea `<EventoMenu>` mientras está montado); si está vacío (ej. tras refresh con la capa restaurada desde la URL), usa `findEventoByLayerId(selectedLayerId)` que resuelve en O(1) contra el index centralizado del provider. `<LayerThemeAvatar>` acepta `imageUrl` para renderizar la imagen del evento sobre el círculo del avatar.

`<EventoMenu>`, además de exponer las capas del evento y el botón "Eliminar (X)" para limpiar capas externas, dispara bbox-fit del mapa al área del evento y auto-activa las capas con `autoActivar=true` cada vez que se monta (cada apertura del menú).

Helpers compartidos en `pages/maps/helpers/eventoHelpers.js` (`buildLayerIndex`, `buildEventoIndex`, plus los wrappers `findLayerByWorkspaceLayer`, `getEventoLayerIds`, `findEventoByLayerId`). El index plano `workspace|layer → node` se construye una vez por cambio de árbol y se reusa para todos los lookups.

## Comparador (swipe)

Estado central en `useSwipeMode` (`compareMode = { active, activeSlot, paneA, paneB, originalSnapshot, swipePosition, swipeOrientation, globalOrder }`). Al entrar a swipe (`enterCompareMode()`) se snapshotea el live state a `originalSnapshot` (+ persiste en `localStorage` con límite de tamaño `SNAPSHOT_MAX_BYTES`), se vacían los panes y el live state queda en `paneA`. La capa activa "viva" sigue siendo el live state (`activeLayerIds`, `hiddenLayerIds`, `layerOpacities`, `filters`); `applySnapshotToLive(pane)` lo sincroniza con el slot activo cada vez que cambia. La orientación (`vertical`/`horizontal`) se persiste por usuario en `localStorage.mapalab.swipe.orientation`.

La lógica del modo vive en `helpers/swipeMode.js` como helpers puros (`purgePane`, `addIdsToPane`, `computeGlobalOrder`, `snapshotFromLive`, `safeStructuredClone`, validators de shape) más constantes nombradas (`SWIPE_POS_MIN/MAX`, `SWIPE_HANDLE_MIN/MAX`, `SWIPE_KEYBOARD_STEP`, `SWIPE_DEBOUNCE_MS`, `SWIPE_POS_THRESHOLD`, `SWIPE_POS_JITTER`, `SNAPSHOT_MAX_BYTES`). Tema visual centralizado en `helpers/swipeTheme.js` (`SLOT_COLORS`, `SWIPE_HANDLE_COLOR`).

- **`paneA` / `paneB`**: snapshots independientes con `activeLayerIds`, `hiddenLayerIds`, `layerOpacities`, `filters`. Una capa puede vivir en uno o en ambos slots. Al sembrar una capa nueva, `addIdsToPane` hereda opacidad y filtros del live state, lo que preserva el `defaultDate` aplicado por `applyDefaultDate`.
- **`globalOrder`**: array de IDs que dicta el orden de la unión `paneA + paneB` en `effectiveActiveLayerIds`. `setLayerSlotMembership` lo extiende, `removeLayerFromSlot` lo limpia, `reorderInSlots` lo reescribe y dispara `applySnapshotToLive` para que el live no diverja del orden global. Sin este array, la unión siempre concatenaba paneA primero y el reorden cross-slot se "regresaba".
- **`paneMapRefs` y `paneMapInstances`**: el primero es un `useRef` con `{ 0: refPaneA, 1: refPaneB }` para acceso síncrono (consumido por `useMapCapture` y `useMapMarker`). El segundo es **state reactivo** `{ 0: mapInstance, 1: mapInstance }` poblado por `<MapView>` vía `setPaneMapInstance` cuando `useMapInitialization` retorna el map; consumido por `useViewSync` y `<ScaleLineControl>` para reaccionar sin polling.
- **Pildora A|B (`<SlotBadge>`)**: cicla membership `A → AB → B → A`. `useSymbology` valida `stillActive` contra `paneA + paneB` (no solo el live state) para que el item no se deseleccione al pasar AB → B; reacciona a cambios de `compareMode` (no via ref) para que el efecto re-evalúe membership de slots.
- **Botón Eliminar en swipe**: quita la capa de **ambos** slots — para mover entre slots se usa la pildora, no el eliminar.
- **`<SwipeSlotControls>`** (barra centrada al fondo de la pantalla): `[A · orientación · B]` con bg blanco unificado; el `<CloseButton>` (rosa, mismo de `MeasurementTools`) sale arriba si hay periodicidad seleccionada o queda dentro de la barra si no la hay. `<DatePill autoWidth>` para que cada pill tome su ancho real.
- **`<SwipeView>`**: dos `<MapView>` superpuestos, el de la derecha clipeado (`inset()` H o V). Handle naranja draggable con knob, posición persistida (debounce 200ms). Overlays "A"/"B" cuando `highlightedSlots` los activa. Accesibilidad: handle es `role="slider"` con `aria-label`/`aria-valuenow/min/max`, `tabIndex={0}` y soporta teclado (←/→/↑/↓ con paso 5%, `Home`/`End` para extremos). Overlays gigantes son `aria-hidden="true"`.
- **`<ScaleLineControl>` en swipe**: usa `paneMapInstances[0]` (state reactivo, paneA) en lugar de `ctx.mapRef.current` (que se desmonta al entrar a swipe). `useScaleLineControl` ya no polea permanentemente: detiene el `setInterval` (250 ms) en cuanto encuentra un map y lo reanuda solo si cambia `getMapInstance`.
- **Persistencia del envelope `kind: 'swipe'`**: `useShareSerializer`/`useShareDeserializer` usan `initialCompareMode()` como base al deserializar para preservar `globalOrder`, `swipeOrientation` y `originalSnapshot`. `useInitializeFromUrl` valida tamaño y shape del JSON de `sessionStorage` antes de aplicar.

## Templates de InfoBox

| Template | Uso | Que genera |
|---|---|---|
| `TEEC` | Puntos simples (cabeceras, cultivos) | header + badges |
| `TDEMEC` | Con municipio (aeropuertos) | + municipio(naranja) + caracteristica(morado) |
| `TDEMECLU` | Con ubicacion (salud) | + list + iconTexts |
| `TDEMECLUEV` | Puntos completos (escuelas) | + stats + text |
| `TEEMLXEV` | Municipio con stats (empleo) | header + municipio + list + text + stats |
| `createMunicipioConfig` | Tasas municipales (mayoria de capas) | header + municipio + fecha + text + cards |
| Config manual | Casos especiales | Definicion libre |

## Proyeccion

- Datos y WMS: `EPSG:6368` (Mexico ITRF2008 / LCC)
- Shapefiles de descarga: `EPSG:4326` (WGS84, compatibilidad universal)
- Mapa en browser: Web Mercator (OpenLayers default)

## Patrones a evitar

- **No mergear capas raster con otras** — cada capa raster necesita `wmsGroup` unico para evitar que el WMS layer manager las combine en una sola request
- **No usar CQL_FILTER en capas `timeEnabled`** — estas usan el parametro TIME de WMS. El filtro de fecha se aplica via `applyFilter(id, 'date', isoDate)` y `useWMSFilterUpdater` lo traduce a TIME
- **No crear commits** — los commits los hace el usuario manualmente, nunca crear commits automaticos
- **No usar rutas relativas en imports** — siempre usar los aliases de Vite (@components, @hooks, etc.)
- **No agregar comentarios en codigo** — ni crear markdowns de explicacion a menos que se indique
- **No duplicar logica** — reutilizar componentes, funciones, helpers y hooks existentes antes de crear nuevos

## Instrucciones de trabajo

### Validacion antes de commit

Siempre ejecutar en `frontend/` antes de considerar una tarea terminada:

```bash
npm install                       # Asegurar dependencias actualizadas
npm run lint                      # Validar reglas ESLint (incluye bloqueo de PNG imports)
npm test                          # Correr tests con Vitest (ver docs/testing.md)
npm run check:dead-code           # Detectar código/exports/dependencias muertas (knip)
```

Si alguno falla, corregir antes de continuar.

Los git hooks del repo (`.githooks/`) automatizan parte de esto:
- **pre-commit**: ESLint sobre archivos staged (via `lint-staged`, rápido)
- **pre-push**: lint completo + tests + knip strict (última línea de defensa)
- **CI**: además ejecuta `npm run build`

Ver `docs/ci-cd.md` para detalles de los hooks y la filosofía de layering (pre-commit rápido, pre-push exhaustivo, CI autoritativo).

### Assets

Los assets importados desde código (`src/assets/`) deben ser **SVG** (preferido) o **WebP** (lossless via `cwebp -lossless`). La regla ESLint `no-restricted-imports` bloquea cualquier `import` de `.png`. El único PNG del proyecto es `frontend/public/img_link_share.png` (OG image referenciado por URL desde `index.html`, no por import).

### Versionado y documentacion

Al completar cambios que se van a versionar:

1. **CHANGELOG** (`docs/CHANGELOG.md`) — agregar entrada en `[No publicado]` o nueva version siguiendo la sintaxis existente (Keep a Changelog + Semver). Secciones: Agregado, Cambiado, Corregido, Eliminado, Rendimiento.
2. **Version** — actualizar solo en `frontend/package.json` (campo `version`). El pre-commit hook sincroniza automaticamente `README.md` y `package-lock.json` via `scripts/sync-version.sh`.
3. **Notas de version** (`frontend/src/pages/maps/helpers/releaseNotes.js`) — agregar entrada al inicio del array `FALLBACK_NOTES` con los cambios visibles para el usuario. Redactar en lenguaje simple sin datos tecnicos sensibles (no mencionar servidores, credenciales, IPs, puertos, infraestructura interna). Cada item lleva un `tag`: `added`, `fixed`, `changed`, `removed` o `perf`. Se muestran en el modal "Que hay de nuevo" del marker IIEG.
4. **Roadmap** (`docs/roadmap.md`) — agregar la version en el checklist y en el timeline mermaid si aplica.
5. **Documentacion afectada** — si los cambios modifican comportamiento documentado en `docs/` (ci-cd, analytics, periodicidad, arquitectura, etc.), actualizar esos archivos tambien.
6. **Planes** (`docs/planes/`) — si se completa una tarea o fase de un plan existente, marcarla como completada o actualizar el estado.

### Conventional commits

Formato: `<tipo>[(ambito)]: <descripcion>`

Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `style`, `build`, `revert`

## Documentacion relacionada

| Archivo | Contenido |
|---|---|
| `docs/arquitectura.md` | Diagramas de infraestructura, red y componentes |
| `docs/ci-cd.md` | Pipeline CI/CD, workflows, secrets, troubleshooting |
| `docs/testing.md` | Inventario de tests, estructura, ejemplos |
| `docs/analytics.md` | Eventos GTM/GA4, parametros, debug |
| `docs/periodicidad.md` | Sistema de filtrado temporal (vectorial y raster) |
| `docs/z-index.md` | Jerarquia de z-index (UI y capas del mapa) |
| `docs/url-sync.md` | Sincronizacion bidireccional de estado con query params |
| `docs/search.md` | Sistema de busqueda: scoring, searchMeta, backend planeado |
| `docs/sider.md` | Sidebar: estados, lockMode, hover y menus flotantes |
| `docs/cache.md` | Inventario de caches (memoria, storage, backend, nginx) |
| `docs/roadmap.md` | Timeline completo y checklist por version |
| `docs/CHANGELOG.md` | Registro de cambios por version |
| `docs/backend.md` | Stack, estructura y desarrollo local del backend |
| `docs/layers.md` | Arquitectura completa del sistema de capas (v1.4.0+) |
| `docs/mcp.md` | Servidor MCP: arquitectura, tools expuestos, cómo probar, auth, cómo agregar/quitar routers |
