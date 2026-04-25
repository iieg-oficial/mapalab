# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere a [Versionado Semantico](https://semver.org/lang/es/).

## [No publicado]

### Pendiente (Fase 3 en desarrollo)
- `<CompareView>`: split UI con dos `<MapView>` reusando `MapsProvider`. Hoy queda el JSON envelope `kind: "compare"` validado en backend y deserializer preparado para `kind: "single"`. La instanciacion de paneles + `useDateOverride(paneIndex)` es el siguiente paso.

## [1.9.0] - 2026-04-24

### Agregado
- **Snapshots persistidos del mapa** (`mapalab.map_shares`): `POST /shares` guarda el estado completo (capas, orden, visibilidad, opacidad, filtros, periodicidad, loop, basemap, vista) en DB y devuelve un hash corto. `GET /shares/{id}` lo restaura. URL: `?s=k3jx9p2m`.
- **Pinning de shares por 1 ano** (`POST /shares/{id}/pin`). Default: retencion sliding window 30 dias desde ultimo acceso.
- **Modal "Compartir mapa"**: reemplaza al `ShareButton` legacy. Crear enlace, copiar, fijar 1 ano. Detecta `?s=hash` en `useInitializeFromUrl` y restaura el estado completo al cargar.
- **Hash determinista** (SHA-256 del JSON canonicalizado, base32 truncado a 10 chars): dos usuarios que arman el mismo mapa comparten el mismo hash → deduplicacion automatica.
- **Rate limiting in-memory** en `POST /shares` (10 req/min por IP-hash) + tamano max payload 64KB.
- **Métricas Prometheus** nuevas en `/metrics`: `mapalab_shares_created_total{kind}`, `mapalab_shares_accessed_total{kind}`, `mapalab_shares_pinned_total`. `incr()` ahora soporta labels.
- **Cron diario `run_cleanup_shares.py`** (04:45 en `dataengine-jobs`): elimina shares no-pinned con `last_accessed_at > 30 dias` y pinned-expirados.
- **Migracion Alembic 0005** en `mapalab-dataengine/jobs/alembic/versions/`: tabla `mapalab.map_shares` con índices condicionales (sliding-window y pinned).

### Cambiado
- **`ShareButton`**: ya no copia el URL viva al portapapeles; ahora abre el `<ShareModal>` que mintea un share persistente. El componente `helpers/handleShare.jsx` legacy se elimina.

## [1.8.0] - 2026-04-24

### Agregado
- **Slugs publicos por capa** (`mapalab.layers.slug`): identificadores legibles tipo `establecimientos-salud` que reemplazan los IDs internos de GeoServer en URLs publicas. Configurables desde mariachi admin con auto-suggest desde el label.
- **Aliases de capa** (`mapalab.layer_aliases`): atajos cortos opcionales (ej: `esalud`) que tambien resuelven a la capa. CRUD via `GET/POST/DELETE /layers/{id}/aliases` en mariachi y nueva tab "Aliases" en `LayerEditPage`.
- **Endpoint `/layers/resolve?ref=<slug-or-alias>`** en mapalab backend para resolucion publica.
- **Deeplink por capa** via `?layer=<slug>`: aterriza con esa capa unica activa + su `defaultDate`.
- **URL viva con slugs** en lugar de IDs: `useUrlSync` y `useInitializeFromUrl` operan en slugs con fallback automatico a id legacy durante 2 releases.
- **Migracion Alembic 0004** en `mapalab-dataengine/jobs/alembic/versions/`: slug + aliases.

### Cambiado
- **Ownership de migraciones del schema `mapalab.*`** revisado (ecosystem.md §7.3 v2): movido de mariachi a mapalab-dataengine. Razon: en prod mariachi y dataengine corren en servidores distintos. Ahora `make prod-migration` y `make migrate` aplican migraciones desde el container `dataengine-jobs` sin depender de mariachi.
- **`bootstrap-v14.sh`** corre `alembic upgrade head` automaticamente al final del bootstrap (idempotente; aplica solo lo nuevo si ya estaba stamped).
- **`prod-migration.sh`** ahora idempotente y re-ejecutable. Default cambia a `--skip-etl` (ETL legacy del Sheet desactivado); para incluirlo `--with-etl` opcional.
- **Container `dataengine-jobs`** incluye `alembic==1.13.3` en sus deps.
- **Targets `make migrate` y `make migrate-status`** en `mapalab-dataengine/Makefile`.
- **`run_refresh_layer_tree.py`**: incluye `slug` y `aliases` en cada nodo del JSON cacheado.
- **Mariachi**: removida la rama `dataengine` de su Alembic (`alembic.ini`, `env.py`, `versions/dataengine/`); `init_db.py` ya no la invoca. Mariachi solo gestiona schema `public.*`/`mariachi.*`.

### Corregido
- `layer_tree_service.get_cached_state()` revalida contra DB via etag check en cada llamada. Cierra la ventana de staleness cross-workers: cuando mariachi (o el cron nocturno) actualiza `mapalab.layer_tree_cache`, los N workers Gunicorn se autosincronizan en su siguiente request sin necesidad de restart ni pub/sub.
- `.env.development`: `DB_HOST=localhost` → `host.docker.internal` para que el backend en container alcance el Postgres de dataengine.

### Documentacion
- `docs/context.md`, `docs/layers.md`, `docs/runbook-layers.md` actualizados para reflejar `make prod-migration` como entrypoint unico de bootstrap en dataengine.
- `docs/planes/PLAN_URL_SHARES_SLUGS.md` agregado: plan completo del feature (slugs + aliases + shares + comparador).
- `mariachi/docs/ALEMBIC_MULTI_ENV.md`: reescrito como single-env con pointer a mapalab-dataengine.
- `gateway-hub/docs/ecosystem.md §7.3` revisado con la nueva politica de ownership de schema.

## [1.7.0] - 2026-04-22

### Agregado
- **Drag & drop de reorden** en el árbol del editor (Ant Design `Tree.draggable`). Solo admin, solo entre hermanos del mismo padre. Llama `PATCH /layers/reorder` y recarga
- **Preview InfoBox con datos dummy** en el drawer: muestra `headerField`, badges (municipio / característica), listas, iconText, stats y texto adicional según el preset seleccionado
- **Formularios dinámicos por preset InfoBox**: `municipio`, `punto`, `punto_municipio`, `punto_ubicacion`, `punto_completo` exponen sólo los campos que aplican. `caracteristicas`, `list`, `iconTexts` usan `Select mode="tags"`
- **Editor JSON para `infobox_config` custom**: textarea monospace + validación en vivo + remount por `key={layer.id}` para evitar contaminación entre capas
- **Endpoint `/metrics` Prometheus** en mariachi (`app/api/metrics.py`) con contadores in-memory: `mariachi_rate_limit_hits_total`, `mariachi_tree_notify_total`, `mariachi_geoserver_calls_total`. Formato `text/plain; version=0.0.4`. Sin deps nuevas (defaultdict + threading.Lock)
- **Endpoint `/metrics` Prometheus** en mapalab backend (`app/metrics.py`): `mapalab_tree_requests_total`, `mapalab_tree_cache_hits_total`, `mapalab_tree_refresh_total`, `mapalab_search_requests_total`, `mapalab_download_requests_total`
- **Integración huachicol**: `MARIACHI_BACKEND_TARGET` en `.env.example` y `scripts/generate-targets.sh`. `docs/agregar-proyecto.md` actualizado
- **Code-split admin mariachi**: `React.lazy()` + `Suspense` en `Users`, `MenuManager`, `PageEditor`, `Media`, `RevisionQueue`, `MapalabLayers`. Chunks separados por página (MapalabLayers: 43 kB gzip 15 kB). Bundle inicial ya no carga editor rico ni tree
- **Tests integración cruzada mariachi → mapalab** (`test_integration_notify.py`): notifier skip sin URL, POST correcto con mock transport, debounce consolida 5 calls en 1, /metrics Prometheus format, thread-safety del contador (10 threads × 1000 incr = 10_000)
- **Documentación de API de Taiga**: Agregada la guía `docs/taiga.md` con referencias de autenticación y flujos automatizados en Bash/Python para proyectos, épicas, historias, tareas y Wiki.
- **Tests `/metrics`** en mapalab (`test_smoke.py::TestMetrics`): response plaintext, increment en `/layers/tree`, increment de cache hits en 304

### Cambiado
- `useLayerTreeAdmin` expone `reorderLayers(parentId, orderedIds)`
- `LayerEditDrawer` usa `Form.useWatch` en `workspaceAlias` / `geoserverLayer` / `infoboxTemplate` / `infoboxParams` / `infoboxConfig` (elimina state paralelo)

### Eliminado / Deuda legacy
- **`public.mapalab_card` deprecado** en el backend mapalab:
    - `MapalabRepository` borrado (`app/repositories/mapalab_repository.py`)
    - `Mapalab_Card` model borrado (`app/models/mapalab.py`)
    - `routers/metadata.py` eliminó fallback legacy: lee solo de `mapalab.layer_metadata`/`layer_stats`
    - `download_repository.resolve_db_name` ahora consulta `mapalab.layer_metadata.layer_name_db`
- **ETL Google Sheet eliminado en dataengine-jobs**:
    - Borrados: `jobs/run_bootstrap.py`, `jobs/core/mapalab_card/*`, `jobs/core/schemas/mapalab_card.py`, `jobs/alembic/mapalab_card/*`
    - Borradas deps de runtime: `pandas`, `gspread`, `google-auth`, `alembic` en `requirements.txt`
    - Credenciales Google (`iieg2025-cloud-*.json`) purgadas del container
    - **Preservado:** `jobs/bootstrap/run_migrate_mapalab_card.py` (migración 1-shot self-contained) + target `make migrate-mapalab-card`
- Env vars `MAPALAB_CARD_DB_*` renombradas a `DATAENGINE_DB_*` en los jobs y Makefile de dataengine

### Notas de despliegue
- En producción la tabla `public.mapalab_card` todavía existe. Secuencia obligatoria antes del pull del backend mapalab:
    1. `cd /IIEG/mapalab-dataengine && git pull && make up`
    2. `make bootstrap-v14 LAYERS_JSON=...` (idempotente: crea schema + seed + migra `mapalab_card` → `layer_metadata`/`layer_stats`)
    3. Verificar counts en `mapalab.layer_metadata` (esperado ~107) y `mapalab.layer_stats` (~102)
    4. `cd /IIEG/mapalab && git pull && make up`
- Documentada en `mapalab-dataengine/docs/bootstrap-v14.md` sección "Despliegue en produccion (primera vez)"

## [1.6.0] - 2026-04-22

### Agregado
- **Selector GeoServer en `LayerEditDrawer`**: los campos `workspaceAlias`, `geoserverLayer` y `styles` se poblan desde `/geoserver/workspaces` y `/geoserver/workspaces/{alias}/layers/{layer}/styles`, reemplazando inputs libres por `Select` + `AutoComplete`. Evita errores de captura manual y deriva `layers` por workspace
- **Edición masiva de tags** (`BulkTagsDrawer` + `PATCH /layers/bulk-tags`): drawer con textarea que acepta paste-from-Excel (TSV). Parsea filas `layer_id [TAB] tag1, tag2`, muestra preview en tabla y aplica hasta 500 capas por request. Reporta `not_found` por capa inexistente
- **Rate limiter en memoria** (`app/api/rate_limit.py`) con sliding window per user_id: `60 req/min` en writes de `layers.py` + `layer_metadata.py`, `120 req/min` en reads de `geoserver.py` (protege llamadas a GeoServer REST). Responde `429` con `Retry-After`
- `useLayerTreeAdmin` expone `listGeoserverWorkspaces`, `listGeoserverFields`, `listGeoserverStyles`, `bulkUpdateTags`

### Cambiado
- Endpoints write de `layers.py` (`POST`, `PUT`, `DELETE`, `PATCH /reorder`, `PATCH /initial-order`, `PATCH /bulk-tags`, `POST /duplicate`) añaden dependencia `_write_rate_limit`
- Endpoints write de `layer_metadata.py` (`PUT /{layer_key}`, `PUT /{layer_key}/stats`) añaden dependencia `_write_rate_limit`

## [1.5.1] - 2026-04-22

### Agregado
- **Workflow editora → borrador → admin aprueba**: UI del editor diferencia role. Editora ve "Guardar borrador" y "Enviar a revisión"; admin ve "Guardar" directo. Usa `PUT /borradores/layer/{id}` + `POST /borradores/layer/{id}/solicitar-revision` (endpoints genéricos existentes). Admin aprueba con `/borradores/por-id/{id}/aprobar` que materializa en DataEngine
- `useLayerTreeAdmin.js` expone `saveLayerDraft`, `requestReview`, `getLayerDraft`
- `LayerEditDrawer.jsx` recibe prop `isAdmin` y ajusta botones
- **Tests smoke mapalab backend** (8 tests): `/health`, `/layers/tree` con ETag + 304, `/layers/initial-order`, `/layers/workspaces`, validación `/search`. Primer test backend del repo (antes: 0)
- **Tests unit mariachi** (18 nuevos): `test_stats_templates.py` cubre validación de SQL injection, identificadores, positions duplicadas, todas las operaciones + `build_query` con placeholders
- **`docs/runbook-layers.md`** con 8 escenarios de recuperación: cache corrupta, layers vacío, stats desactualizadas, permisos mariachi, cron parado, ETag stale, rollback, Alembic roto

### Cambiado
- mapalab backend: primer `test/` directory con `conftest.py` que mockea DB + SchedulerService

## [1.5.0] - 2026-04-22

### Seguridad
- **Template catalog reemplaza SQL libre en `stats_config`**: eliminada la capacidad de escribir SQL arbitrario. Ahora 8 operaciones validadas: `count`, `count_distinct`, `count_where`, `sum`, `avg`, `min`, `max`, `latest`. `schema`, `table`, `field`, `where_field`, `order_field` validados como identificadores (`[A-Za-z0-9_]{1,100}`). Valores interpolados por `:param` (no concatenados)
- **Debounce de `notify_tree_changed()` en mariachi** (5s): múltiples writes disparan solo 1 refresh del tree cache
- `WORKSPACE_SCHEMA_MAP` hardcoded eliminado en mapalab backend: `resolve_schema()` ahora hace lookup cacheado a `mapalab.workspaces`

### Agregado
- `app/services/stats_templates.py` en mariachi con `validate_stats_config`
- Diagrama de secuencia Mermaid en `docs/layers.md` (flujo editora → admin → visor)

### Cambiado
- `run_refresh_layer_stats.py` en dataengine-jobs usa el mismo template catalog

### Breaking (MINOR bump)
- `stats_config` en `mapalab.layer_stats` cambió de shape: antes `{query, format}`, ahora `{operation, schema, table, field, ...}`. Rows con el viejo shape se marcan como inválidas en el refresh job (skipped). Admin debe reconfigurar desde el editor.

## [1.4.8] - 2026-04-22

### Corregido
- **Búsqueda no encontraba leaves** tras migración: `processLayerTree` en `searchConfig.js` usaba `if (child.children)` pero el backend devuelve `children: []` consistentemente, marcando los leaves como "no-leaf" y saltando su indexación
- Cambio: usar `Array.isArray(children) && children.length > 0` como chequeo

### Agregado
- `docs/search.md` (reescrito) describe el flujo completo: scoring, edición de tags, ejemplos prácticos

## [1.4.7] - 2026-04-22

### Corregido
- **Búsqueda de capas no encontraba resultados** tras el refactor de v1.4.3: `searchConfig.js` construía `SEARCH_CONFIG` al importarse desde el barrel `layers` (ya eliminado), quedándose vacío
- Ahora `SEARCH_CONFIG` es mutable y se construye via `rebuildSearchConfig(tree)` invocado en `LayersProvider` tras el fetch
- Mantiene el scoring sofisticado del cliente (Levenshtein, normalización de plurales, pesos por label/tag) — cero round-trips por keystroke

### Notas de arquitectura
- La búsqueda de **nombres de capas** sigue siendo 100% client-side (latencia cero)
- El endpoint `GET /mapalab/api/layers/search` se mantiene para otros consumidores (links compartidos, API pública futura)
- Para que una capa sea encontrada por palabras clave sinónimas (ej. "IMSS" cuando se busca "hospital"), usar el campo `search_tags` en el editor mariachi (`mapalab.layers.search_tags TEXT[]`). El scoring ya asigna hasta +25 puntos por tag match

## [1.4.6] - 2026-04-22

### Corregido
- **InfoBox no mostraba información de features** y **descargas WFS fallaban**: los servicios `featureInfoService.js` y `downloadService.js` importaban `layers` del barrel obsoleto (v1.4.3 eliminó esa exportación)
- `featureInfoService.js`: `getFeatureInfoForActiveLayers` y `getFeaturesInPolygonForActiveLayers` reciben `allLayers` como parámetro; los callers en `useFeatureInfo.js` lo pasan desde `MapsContext.allLayers`
- `downloadService.js`: setter module-level `setLayersForDownloadService(layers)` (mismo patrón que `layerMetadataService`), invocado en `LayersProvider` tras el fetch

### Cambiado
- Tests de `downloadService.test.js` actualizados al nuevo shape de mocks

## [1.4.5] - 2026-04-22

### Corregido
- **Capas WMS no se renderizaban**: el backend devuelve `wmsConfig` con campos estructurales (`geoserverWorkspace`, `geoserverLayer`, etc.) pero el frontend esperaba `baseUrl` + `layerName` completos para OpenLayers
- `hydrateLayerTree(tree)` en `helpers/wmsConfig.js` construye `baseUrl` y `layerName` en cliente usando `VITE_GEOSERVER_URL`, aplicado en `LayersProvider` justo después del fetch
- Consumidores (`useWMSLayerFactory`, `useWMSLayerManager`, `useWMSLegend`) no cambian — siguen leyendo `wmsConfig.baseUrl` y `wmsConfig.layerName` transparentemente

### Cambiado
- Backend permanece agnóstico de la URL pública del GeoServer; si cambia el dominio no hay que redeployar backend
- Tests: 9 nuevos en `wmsConfig.test.js` (477 → 478); `createWMSConfig` (eliminado en v1.4.3) reemplazado por `hydrateWmsConfig` + `hydrateLayerTree`

## [1.4.4] - 2026-04-22

### Agregado
- `docs/layers.md` con arquitectura completa del sistema de capas v1.4.x
- Script idempotente de bootstrap para DataEngine (`mapalab-dataengine/scripts/bootstrap-v14.sh`) que orquesta rol, schema, migraciones y seed en un solo comando
- `make bootstrap-v14 LAYERS_JSON=...` en `mapalab-dataengine`

### Eliminado
- `docs/planes/PLAN_MIGRACION_CAPAS.md` y `docs/planes/ADR_001_capas_architecture.md` (ya implementados)
- Flag `VITE_LAYERS_FROM_BACKEND` (siempre on)

## [1.4.3] - 2026-04-22

### Cambiado
- **Refactor total del sistema de capas**: eliminados los 9 archivos `frontend/src/pages/maps/helpers/layers/definitions/*.js` (~1590 líneas), `rasterHelpers.js` y `layerFactory.js`
- Nuevo `LayersContext` + `LayersProvider` + hook `useLayers()` como fuente única del árbol
- Los 20 consumidores migrados a consumir vía `useLayers()` o `MapsContext.allLayers`
- `layerMetadataService` usa setter module-level (`setLayersForMetadataService`) inyectado por `LayersProvider`
- `layers/index.js` reducido a 1 línea (re-export de `findLayerById`)

### Eliminado
- `frontend/src/hooks/useLayerTree.js` (reemplazado por `useLayers`)
- `frontend/scripts/export_layers_to_json.mjs` (ya no hay JS que bundlear)

## [1.4.2] - 2026-04-22

### Agregado
- **Metadata de capas en DataEngine**: tablas nuevas `mapalab.layer_metadata` (descriptiva) y `mapalab.layer_stats` (numeralia + `stats_config` con queries SQL)
- Endpoints CRUD en mariachi: `/api/administrador/layer-metadata/{layer_key}` + `/stats`
- Script 1-shot `mariachi/api/scripts/migrate_mapalab_card.py` que copia `public.mapalab_card` → `mapalab.layer_metadata` + `mapalab.layer_stats` (idempotente)
- Job diario `run_refresh_layer_stats.py` en `dataengine-jobs` que ejecuta `stats_config` (whitelist SELECT-only) y popula `values`
- `make refresh-layer-stats` y `make refresh-all` (incluye stats)

### Cambiado
- `mapalab/backend/app/routers/metadata.py` lee de `mapalab.layer_metadata` primero, fallback a `public.mapalab_card` legacy
- `jobs/run_bootstrap.py` (ETL Google Sheet) emite deprecation warning; requiere `FORCE_LEGACY_ETL=1` para correr

## [1.4.1] - 2026-04-22

### Agregado
- **Tree materializado** en tabla `mapalab.layer_tree_cache` (singleton JSONB). `GET /mapalab/api/layers/tree` sirve desde DB + caché en memoria del proceso
- Container `dataengine-jobs` (renombrado de `dataengine-mapalab-card`) ahora corre cron con tres tareas diarias: `refresh_periodicity` (03:00), `refresh_layer_tree` (04:00), `refresh_layer_stats` (04:30)
- `make refresh-layer-tree`, `make refresh-periodicity`, `make refresh-all` en `mapalab-dataengine`
- Endpoint `POST /mapalab/api/layers/refresh-cache` para trigger HTTP desde mariachi
- `mariachi/api/app/services/mapalab_notifier.py` invoca el refresh tras cada write

### Cambiado
- `mapalab/backend/app/services/scheduler_service.py` vaciado — los jobs periódicos viven ahora en DataEngine
- Carpeta `mapalab-dataengine/mapalab_card/` → `jobs/` (git mv)

## [1.4.0] - 2026-04-22

### Agregado
- **Arquitectura de capas dinámica**: definiciones ya no se leen de archivos JS hardcodeados. Tablas en DataEngine schema `mapalab`: `layers` (250 nodos seed), `workspaces` (11), `initial_layer_order` (6)
- **Editor de capas** en mariachi `/administrador/mapalab/layers` con Ant Design Tree + drawer de edición (Collapse: Identidad, Visibilidad, WMS, Descarga, InfoBox template)
- **Borradores polimórficos**: `editora` crea borrador via `/borradores/layer/{id}`, admin aprueba con endpoint nuevo `/borradores/por-id/{id}/aprobar` que materializa en DataEngine
- Backend mapalab: `GET /layers/{tree, initial-order, workspaces, search}` con ETag `W/"..."` (304 si coincide)
- Backend mariachi: CRUD `/api/administrador/layers/*` + introspección GeoServer REST (`/geoserver/workspaces`, `.../fields`, `.../styles`)
- `GeoServerClient` con `httpx` para listar workspaces, capas, campos y estilos desde GeoServer REST
- Frontend: `layerTreeService.js` con fetch + ETag/If-None-Match + dedup de in-flight requests
- Templates InfoBox: `municipio`, `punto`, `punto_municipio`, `punto_ubicacion`, `punto_completo`, `custom` (expanden `infobox_params` a `infobox_config` JSON al guardar)
- Tests: 8 nuevos en `layerTreeService.test.js` (469 → 477 totales); 14 en `test_layer_service.py` mariachi

### Infraestructura
- Alembic multi-env en mariachi: `-x db=mariachi` (iieg_portal) y `-x db=dataengine` (schema `mapalab`)
- Rol `mariachi_layers` owner del schema `mapalab` en DataEngine
- `httpx` movido de dev a prod deps de mariachi

## [1.3.0] - 2026-04-21

### Agregado
- `Badge` component extendido: props `color` (`orange`/`purple`/`pink`/`violet`), `size` (`sm`/`md`), `variant` (`count`/`pill`), `text`, `onClick`. Default retrocompatible (orange, md, count)
- Sistema de "nueva característica" en `Badge` via prop `featureKey`: marca visualmente un feature nuevo, al hacer click se persiste en `localStorage` (`mapalab:feature-seen:<key>`) y no vuelve a aparecer hasta que otra key diferente active un nuevo feature
- Hook `useFeatureSeen(key)` en `@hooks/useFeatureSeen` — retorna `[seen, markSeen]`, tolera errores de localStorage (modo privado, quota)
- Auto-pausa de loops temporales al ocultar una capa: `useDateLoop` recibe `hiddenLayerIds` y detiene cualquier loop activo cuya capa pase a estado oculto (evita tile requests WMS desperdiciados)
- **Chunk splitting en Vite**: `build.rollupOptions.output.manualChunks` separa `vendor-react`, `vendor-router`, `vendor-ol`, `vendor-dnd`, `vendor-lottie` y `vendor-export`. El chunk de entrada baja de 678 kB → 105 kB (gzip 205 → 30 kB)
- `rollup-plugin-visualizer` detrás de `VITE_ANALYZE=1` para treemap y JSON de stats (`dist/stats.html`, `dist/stats.json`)
- Regla ESLint `no-restricted-imports` que bloquea todo import `.png` con mensaje explicando la alternativa (WebP/SVG). Rompe el build si se intenta meter un PNG sin `eslint-disable-next-line` justificado
- `knip` (dead-code checker) + scripts `check:dead-code` (informativo) y `check:dead-code:strict` (bloqueante). Config en `frontend/knip.json`
- `lint-staged` corriendo ESLint solo sobre archivos staged en el pre-commit hook
- `.githooks/pre-commit` agrega `npx lint-staged` tras el sync-version
- `.githooks/pre-push` agrega `npm run check:dead-code:strict` después de lint y tests
- CI (`.github/workflows/test-frontend.yml`) agrega los pasos `Dead code check` y `Build` al final del pipeline
- **Sentry** (`@sentry/react` + `@sentry/vite-plugin`) para error tracking en producción. Init en `main.jsx` gated por `VITE_SENTRY_DSN` (sin DSN, SDK no se activa — zero impacto en dev). `<Sentry.ErrorBoundary>` envuelve el `RouterProvider`. Sourcemap upload automático en CI si `SENTRY_AUTH_TOKEN` está configurado. Filtros anti-ruido: GTM, Google Analytics, YouTube embed (que genera `ERR_BLOCKED_BY_CLIENT` en navegadores con adblocker)
- Plugin **jsx-a11y** de ESLint con `flatConfigs.recommended`. Reglas noisy (`click-events-have-key-events`, `no-static-element-interactions`) en `off` por ahora — migrar `<div onClick>` → `<button>` queda como follow-up. El resto (labels, autofocus, non-interactive handlers) enforced desde ahora
- **Coverage thresholds** en `vitest.config.js`: lines 60%, functions 65%, branches 40%, statements 55%. CI corre `npm run test:coverage` en lugar de `npm test` para enforzarlos
- **Dependabot** configurado (`.github/dependabot.yml`): scan semanal de deps npm + GitHub Actions, agrupado por familias (eslint, testing, sentry, openlayers, react) para reducir ruido de PRs
- Chunk `vendor-sentry` separado en `manualChunks` (14 kB gz, se carga solo si `VITE_SENTRY_DSN` está seteado)
- Plan `docs/planes/PLAN_GLITCHTIP.md` para migrar a GlitchTip self-hosted sobre huachicol cuando haya capacidad (evitar datos de errores en SaaS externo)
- **Sentry Python SDK en backend**: `sentry-sdk[fastapi]` en requirements, init gated por `SENTRY_DSN` en `server.py`. Instrumentación automática de FastAPI. Variables `SENTRY_DSN` y `SENTRY_TRACES_SAMPLE_RATE` en `.env.example`
- **Dependabot para pip** (backend): scan semanal, grupos `fastapi-stack` y `sqlalchemy`
- **Security headers conservadores** en `nginx/nginx.conf`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (geolocation=self, microphone/camera=none). CSP queda como follow-up (requiere inventario completo de orígenes)
- Util `@utils/a11y.js` con `handleKeyActivate(callback)` para agregar soporte de teclado (Enter/Space) a elementos interactivos
- Alias `@utils` en `vite.config.js` (ya estaba en vitest)
- Tests: `LottieSpinner.test.jsx` (2 tests), `useFeatureSeen.test.js` (7 tests), `layerExtentService.test.js` (8 tests) — 452 → 469 tests
- **Servicio `layerExtentService.js`** con `fetchLayerExtent(layer)`: hace WFS `GetFeature` en `EPSG:3857`, parsea GeoJSON con `ol/format/GeoJSON` + `ol/source/Vector`, retorna `source.getExtent()`. Cachea por `baseUrl|layerName|cqlFilter` (LRU max 50), timeout 10s, tolera errores retornando `null`. Exporta `clearExtentCache()` para tests/reset
- **Modo dinámico `defaultZoom: 'fit'`** (también `{ fit: true }`) en `applyDefaultZoom` (`useLayerToggle.js`): hace fetch del extent real de las features y llama `view.fit(extent, { padding: [40,40,40,40], maxZoom: 18, duration: 500 })`. Alternativa al extent hardcoded para capas donde el bbox es incierto o cambia en GeoServer. Documentado en `docs/zoom.md`
- **3 capas Primavera** (`bosque_de_la_primavera`, `agave_primavera`, `parcelas_primavera`) usan `defaultZoom: 'fit'` — encuadran al extent real del ANP dinámicamente
- Constantes `FIT_PADDING`, `FIT_MAX_ZOOM`, `FIT_DURATION` en `useLayerToggle.js` para unificar los parámetros de `view.fit` / `view.animate`
- `role="region"` en carrusel de opciones en Home para etiquetado semántico
- `aria-pressed` en `ActiveLayerItem` para indicar estado seleccionado
- `aria-expanded` en cards de FAQ en Home para indicar estado colapsado/expandido

### Cambiado
- Labels de los botones del header de `ActiveLayersList` (Mostrar/Ocultar, Eliminar, Pausar animaciones) ahora son visibles siempre cuando hay ≤ 2 botones; se ocultan automáticamente cuando hay > 2 (ej. cuando aparece el de pausa global). Lógica a prueba de futuros botones via `visibleHeaderButtons`
- 3 badges hardcodeados en `ActiveLayersList` (conteo de visibles, eliminar, loops activos) y el pill `index/total` de `MobileFeatureHeader` migrados al componente `Badge` con sus props semánticos
- Controles de periodicidad en `ActiveLayerItem` (label de fecha, play/pause, velocidad, dirección) se ocultan cuando `layer.visible === false` — un solo guard en el contenedor padre
- Botón play/pause en `ActiveLayerItem` siempre se renderiza junto a velocidad/dirección (antes desaparecía cuando `canPlayLoop === false`). Si no hay config inferible de loop, se renderiza `disabled` con `opacity-50 cursor-not-allowed`
- `gap-3` → `gap-2 md:gap-3` en el row de botones del header de `ActiveLayersList` para mejor ajuste en viewports angostos
- `SwipeToRemove`: al confirmar el swipe, la card eliminada ahora colapsa su `max-height` y `margin-top` a `0` en paralelo con el `translateX` (transición 220ms ease-out). Las cards restantes se deslizan hacia arriba suavemente en vez de saltar al desaparecer la eliminada
- **Mobile — paneles de capas ya no bloquean clicks del mapa**: `MapLayersPanels` añade `max-md:pointer-events-none` al contenedor `Panel` (transparente), y los paneles internos (`ActiveLayersList`, `SymbologyPanel`, wrapper del `Message`) añaden `max-md:pointer-events-auto`. En mobile los clicks pasan por las zonas vacías/gap del panel al mapa, permitiendo mediciones a la altura de Simbología/Capas Activas
- **Home — scroll**: `min-h-screen` root con `overflow-x-hidden` (previene overflow horizontal residual de `mx-[3%]` / `ml-[3%]` + cards del carrusel). Carrusel de opciones con `[&::-webkit-scrollbar]:hidden [scrollbar-width:none]` (antes usaba `scrollbar-thin scrollbar-hidden`, clases inexistentes)
- **Scrollbar vertical global personalizado** en `index.css`: `html { scrollbar-width: thin; scrollbar-color: rgb(156 163 175 / 0.5) transparent }` + `html::-webkit-scrollbar { width: 6px }` con thumb gris translúcido y hover más oscuro. Aplica a toda la app
- **11 assets PNG → WebP** (lossless `cwebp -lossless`): `ico_preguntas`, `bannerHeader`, `img_info_banner`, `img_descargada_banner`, `img_herramientas_banner`, y los 6 `minimap_{estatal,federal}_{voyager,positron,sin_mapa}`. Ahorro ~170 kB sobre la optimización previa con `oxipng`. Imports actualizados en `selectConfig.js`, `bannerConfig.js`, `suportConfig.js`, `minimapImages.js`
- Imports dinámicos de OpenLayers (`ol/style`, `ol/layer/Vector`, etc.) en `useMapMarker.js` y `MapControls.jsx` convertidos a estáticos (ya estaban en el bundle; el `import()` no lograba code-split)
- Barrel `pages/maps/helpers/layers/index.js` reducido a solo re-exportar `findLayerById` y `layers`. Los consumidores (`useLayerManagement`, `useActiveLayersLogic`, `useFeatureInfo`) importan directo desde `utils/layerHelpers`
- Barrel `pages/maps/components/ActiveLayers/index.js` reducido a solo `ActiveLayersList`
- **Lottie lazy-loaded**: extraído `LottieSpinner.jsx` como componente dedicado, cargado via `React.lazy` + `Suspense` en `Logo.jsx`. El chunk `vendor-lottie` (82 kB gz) ya no está en el path inicial — se carga solo cuando Logo monta, en paralelo al resto
- **`vendor-export` dividido** en dos chunks: `vendor-download` (jszip + pako + fast-png + fflate + iobuffer, 46 kB gz — solo para descargas) y `vendor-export` (jspdf + html2canvas + deps, 220 kB gz — solo para MapExport). Usuarios que solo descargan ya no cargan las libs de PDF
- CI usa `npm run test:coverage -- --run` en lugar de `npm run test -- --run` para que los thresholds rompan el build si la cobertura baja
- **Lottie condicionado a `isLoading`**: `LottieSpinner` ya no se renderiza si el usuario nunca ha disparado un estado de carga — el chunk `vendor-lottie` (82 kB gz) se descarga solo bajo demanda real. Estado `lottieNeeded` se activa en el primer `isLoading=true` y se mantiene para permitir fade-outs subsecuentes
- **A11y: `<div onClick>` refactorizados a `<button type="button">` o con `role="button" tabIndex={0} onKeyDown`** en:
  - `Badge`, `Icon`: span clickeable ahora condicionalmente `<button>` cuando hay onClick
  - `MobileSheet`: backdrop como `<button aria-label="Cerrar">` con fondo full-bleed
  - `Body.jsx`: FAQ cards con `role=button`, `aria-expanded`, `onKeyDown` para teclado
  - `ActiveLayerItem`: capa clickeable con `role=button`, `tabIndex=0`, `aria-pressed`
  - `ActiveLayersList`: 3 toggles del header (visibilidad, eliminar, pausar) convertidos a `<button>` con `disabled` apropiado
  - `LayerItem`, `LayerDetailModal`, `QualitySelector`, `MenuItem`: span/div con click → `<button>`
  - Reglas ESLint `click-events-have-key-events` y `no-static-element-interactions` reactivadas

### Corregido
- Import no usado `openDataImg` en `MapAttribution.jsx` — limpia el error de lint preexistente
- **Swipe-to-remove en InfoBox mobile**: bug de "index as key" que causaba que los estilos inline del card eliminado (translateX, maxHeight: 0) se aplicaran al siguiente card que tomaba su slot en el array. Fix: `key={feature.id ?? \`${result.layerId}-${featureIdx}\`}` para que React desmonte el card correcto y las animaciones queden aisladas

### Eliminado
- 4 PNGs huérfanos en `src/assets/images/`: `img_link_share.png` (el OG image vive en `public/`), `testBG.png`, `search.png`, `80x15_open_data.png`
- 9 componentes `.jsx` detectados por knip como muertos: `components/ConfirmModal.jsx`, `components/HamburgerMenu.jsx`, `components/Navigation.jsx`, `components/MenuItem.jsx`, `pages/home/components/PrimaryButton.jsx`, `pages/maps/components/NavigationButton.jsx`, `pages/maps/components/InfoBox/components/LabelGroup.jsx`, `pages/maps/components/MapExport/ExportMapFooter.jsx`, `pages/maps/components/MapExport/utils/layoutHeader.jsx`
- Funciones sin usar: `getLayersWithWMS`, `loadLayerSymbology`, `loadMultipleLayersSymbology` (`layerHelpers.js`); `isCategoryLayer` (`symbologyHelpers.js`); `getSearchConfigByTheme` (`searchConfig.js`); hook `useSiderAnchoredPosition` (`SiderContext.jsx`)
- Constantes sin usar: `SIDER_TRANSITION_LEFT`, `SIDER_TRANSITION_BOTH` (`constants/sider.js`)
- `export default` sin consumir en `SiderContext.jsx`, `SearchContext.jsx`, `useFeatureSeen.js`
- Exports degradados a locales (usados solo internamente): `createBaseItems`/`createCategoryItems` (`menuItems.jsx`), `getWMSLayerName` (`symbologyHelpers.js`), `fetchWithProgress` (`downloadService.js`), `SEARCH_CONFIG` (`searchConfig.js`), `isMobileViewport` (`defaultView.js`), `FEATURE_SEEN_PREFIX` (`useFeatureSeen.js`)

### Rendimiento
- Bundle inicial menor y chunks con hash estable: los `vendor-*` cambian solo cuando se actualiza la librería, mientras el código de app cambia seguido. Mejor cacheo en navegadores y gateway-hub
- Assets estáticos (imágenes de branding y minimaps) ~170 kB totales menos tras migración a WebP

## [1.2.0] - 2026-04-17

### Agregado
- **Sistema de loop de fechas generalizado** (`useDateLoop`, renombrado desde `useRasterLoop`): soporta modo `year` y `month` tanto para capas raster como vectoriales (CQL_FILTER). Helpers nuevos en `dateLoopHelpers.js` (`describeDateFilter`, `formatLoopLabel`, `buildLoopValues`, `computeSelectorInitialState`). El loop infiere modo segun vista del selector (`expandedYear`) o filtro activo
- Controles de loop en header "Periodicidad:" del LayerDetailModal: `PlayPauseButton`, `LoopIntervalButton` (morado, cicla 250/500/1000/2000/3000 ms), `LoopDirectionButton` (morado, toggle LTR/RTL), boton eliminar filtro
- Componentes extraidos a `SimpleDateSelectorParts.jsx`: `BackButton`, `YearBadge`, `PlayPauseButton`, `CarouselArrow`, `LoopIntervalButton`, `LoopDirectionButton`
- Etiqueta de fecha activa en `ActiveLayerItem` con formatos `"2024"` / `"JUN 2024"` / `"3 MESES 2024"` / `"N AÑOS"`. Anchos fijos por tipo (static vs loop) para evitar rebote. Click: toggle loop si es posible, si no abre modal
- Badge morado de intervalo (`"1s"`, `"2s"`) junto al label en `ActiveLayerItem` cuando `loopIntervalMs !== DEFAULT_LOOP_INTERVAL_MS` y el loop corre
- Auto-scroll del carrusel de años al valor current del loop durante mode `year` (si queda fuera del viewport, scroll suave para centrarlo)
- Prop `onExpandedYearChange` en `SimpleDateSelector` para que el modal conozca la vista (año vs mes) y decida el modo del loop
- Edicion en-mapa de Emoji/Texto colocados: click para seleccionar (halo morado), drag para mover, sliders de rotacion y escala 50-300%, boton eliminar. Toolbar flotante posicionado via `ol.Overlay` que sigue pan/zoom. Escape o cambio de herramienta deseleccionan. Ver `docs/draw.md`
- `useMapEditing` hook con `ol.interaction.Translate` + `editingClickedRef` (evita conflicto con el query de InfoBox)
- `FeatureEditToolbar` componente reutilizable para controles de transformacion
- `createEmojiStyle` / `createTextStyle` extendidos con `scale` y `selected`
- Flag `openOnShow` en definiciones de marker para abrir automaticamente la InfoBox al aparecer (opt-in, activo en marker del IIEG)
- Helper `openMarkerCard(feature)` exportado de `useMapMarker` y reutilizado en el click handler
- Componente primitivo `MobileSheet` (`components/MobileSheet.jsx`) con portal, backdrop, translateY, Escape, click-fuera y body lock configurables
- Rama mobile en InfoBox: bottom-sheet con indicadores "hay mas arriba/abajo" (via `useScrollOverflow`) y seccion de herramientas (`InfoBoxTools`) extensible en el header
- Componente `InfoBoxTools` con API `tools=[{ id, icon, label, tooltip, onClick, disabled }]` para crecer con mas acciones a futuro
- `MobileFeatureHeader` — header alternativo para cards en mobile: barra lateral morada + titulo tipografico, sin bloque `#EFF3FC` fijo
- `renderCard(variant)` acepta `'desktop'` (default) o `'mobile'` y elige el header correspondiente
- `SwipeToRemove` — wrapper que permite eliminar cards deslizando horizontalmente (solo mobile) con etiqueta guia "Desliza para eliminar"/"Eliminando…"
- `LicenseTooltipContent` — extraido de `DownloadButton` a `@components/` para reuso (tooltip legal de descarga)
- Tipografias aumentadas en `Text`, `List`, `Cards`, `IconText`, `Label` cuando `variant='mobile'` (de 10px a 12px, y de `text-sm` a `text-[15px]` en valores de cards)
- Grid de `Cards` fuerza `grid-cols-2` en mobile aunque el template indique 1 columna
- `ScrollContainer` reemplaza el scroll manual de InfoBox mobile — incluye flechas bounce arriba/abajo y fade gradient nativos
- `InfoCard` — wrapper compartido con shell `bg-white rounded-[10px] shadow-[...]` y header adaptativo (`desktop`/`mobile`). Unifica renderCard, `EmptySuggestions`, `SummaryCard` y el estado "sin capa seleccionada", elimina duplicacion de la cascara y los 3 estilos de header
- Cache de `alternativeResults` en `selectedFeatureInfo` — al tapar una capa sugerida se filtra en memoria sin re-consultar GeoServer. Limpieza proactiva por cambio de `activeLayerIds` o `filters`. Ver `docs/cache.md`
- `docs/cache.md` — inventario centralizado de todos los caches del proyecto (frontend memoria/storage, backend, nginx, assets)
- `getDefaultMapView()` y `getMinZoom()` en `helpers/defaultView.js` — centralizan la vista inicial y minZoom del mapa
- Capa de salud con `defaultDate: 'latest'`
- Icon `done` en `Icon.jsx`

### Corregido
- Vectoriales tambien pueden animar periodo (antes solo raster). Al iterar, el `ActiveLayerItem` mantiene visible el boton de detalle durante el loop (antes desaparecia por `isLoading`)
- En polígonos, regresar a "todos los años" mantiene el año seleccionado en naranja (antes se perdía la selección visual al volver). Re-click del mismo año preserva la selección del mes
- Sincronización con filter externo: al limpiar el filtro desde el header, el selector vuelve a la vista de años limpia (antes quedaba el state local desincronizado)
- Al tapar una capa alternativa en EmptySuggestions ahora se muestran sus features en el punto clickeado (antes solo cerraba el panel sin mostrar nada)
- Documentacion `docs/mobile-sheet.md` y `docs/infobox.md`

### Cambiado
- Etiqueta de fecha en `ActiveLayerItem` no muestra el ícono play estático (solo pause cuando corre el loop)
- Padding reducido en etiqueta (`p-1.5` → `p-1`, `rounded-[12px]` → `rounded-[10px]`), fuente 9px → 10px
- Años ordenados descendente en `buildLoopValues` para matchear el orden visual del carrusel
- Cuando el loop corre, el año/mes actual se pinta en naranja institucional (no morado) para indicar el tick
- En vista de meses el tick del loop no muestra borde naranja (más sutil), manteniendo `border-transparent` para no rebotar
- Click en el logo IIEG del sider colapsa el sider en mobile (`closeSider`) ademas de mostrar el marker
- `showMarker` llama a `openMarkerCard` como callback de `view.animate`, garantizando que la InfoBox quede centrada sobre el icono al terminar la animacion
- `MobileMenu` refactorizado como wrapper delgado de `MobileSheet` conservando `registerInSider`
- `Header` y `EmptySuggestions` del InfoBox usan `w-full` en lugar de `w-[239px]` fijo, el ancho lo determina el contenedor padre
- `useMapInitialization` respeta `layers` en URL para decidir si aplicar `lat/lon/zoom` (evita centrar en coordenadas sin capas)
- `SymbologyPanel` boton siempre clickeable (abre panel aunque no haya capa)
- `iturConfig` cards con `decimals: 2` para métricas proporcionales
- ActiveLayersList: boton de modo base también activa capas si no hay ninguna activa

## [1.1.4] - 2026-04-15

### Agregado
- Tooltip de licencia IIEG en botones de descarga de capas y visualizacion con link clickeable al PDF
- Prop `interactive` en componente Tooltip para permitir clicks en contenido (links, botones)
- Constantes `LICENCIA_URL` y `LICENCIA_TEXTO` en `@constants/app`
- LittleCard especifica para capa ANP Jalisco con campos nombre, jurisdiccion, tipo, area_ha

### Cambiado
- CI/CD optimizado: tests corren 1 vez (en auto-merge) en lugar de 3, cache de npm en CI, deploy con `git reset --hard` para evitar conflictos
- Emojis: eliminada categoria Banderas y emoji 💩

### Corregido
- ID de capa ANP colisionaba con ID de categoria (fix en v1.1.3 incompleto)
- Panel de emojis aparecia detras del boton cerrar herramientas en mobile (z-index)

## [1.1.3] - 2026-04-15

### Agregado
- Capa "Areas Naturales Protegidas" en Recursos > Areas Protegidas
- Catalogo completo de emojis con 9 categorias y tabs en herramienta de mediciones
- Video de YouTube en pagina de inicio despues de la guia
- Meta tags Open Graph y Twitter Card para compartir enlaces con imagen y descripcion
- Plugin Vite `htmlMetaPlugin` para inyectar URL del sitio en meta tags en build time

### Cambiado
- Licencia Creative Commons BY 4.0 reemplazada por Licencia IIEG 2026 en atribucion del mapa
- Titulo de guia en home: "¿Que puedes hacer en MapaLab?" en lugar de "¿Como navegar en MapaLab?"
- Titulo de la pagina: "MapaLab — IIEG"
- Meses en fechas de ultima actualizacion en minusculas
- Boton centrar Jalisco usa `view.fit()` con padding proporcional al viewport (responsive)
- Panel de emojis homologado al ancho de Mis Mediciones (334px)

### Corregido
- ID de capa `areas_naturales_protegidas` colisionaba con ID de categoria, renombrado a `anp_jalisco`
- InfoBox: links no se activan accidentalmente al aparecer (200ms delay de pointer-events)
- Modal: scroll en mobile no cierra el modal (stopPropagation en touchstart/mousedown)
- Modal: backdrop solo cierra con tap, no con swipe (deteccion de movimiento < 5px)
- Boton centrar Jalisco ahora aparece correctamente en mobile (fix mouseLeave en touch devices)
- useOutsideClick ignora eventos dentro de elementos con role="dialog"

## [1.1.2] - 2026-04-15

### Agregado
- Control de SEO por entorno: `SEO_ENABLED` en Nginx bloquea robots.txt, sitemap.xml y agrega `X-Robots-Tag: noindex` en staging. Produccion lo habilita con `SEO_ENABLED=true`
- Retry con 3 intentos en workflow de auto-merge para PR inestables

### Cambiado
- Descripcion del proyecto actualizada en package.json y marker IIEG

## [1.1.1] - 2026-04-14

### Cambiado
- InfoBox del marker IIEG: tecnologias como etiquetas individuales, nombre del instituto como campo "Organismo"
- Retry con 3 intentos en workflow de auto-merge para PR inestables
- Instrucciones de versionado en context.md incluyen actualizacion de release notes

### Corregido
- Orden de renderizado en renderCard restaurado al original (list → iconText → text → cards) para no afectar otros InfoBox
- Label opcional en componente List del InfoBox

## [1.1.0] - 2026-04-14

### Agregado
- Propiedad `defaultZoom` en definiciones de capas: zoom automatico al activar (3 formatos: numero, zoom+center, extent)
- Propiedad `zoomRange` en definiciones de capas: rango de zoom para visibilidad via `minZoom`/`maxZoom` de OpenLayers
- Boton "Centrar en Jalisco" en controles del mapa: aparece al hacer hover sobre zoom-in, resetea vista a bounds de Jalisco
- Hook `useMapMarker`: marcadores temporales reutilizables con icono, zoom, fondo circular, `minZoom`/`maxZoom` y auto-hide
- InfoBox para markers: click en marcadores muestra InfoBox con datos estaticos via propiedad `infoBox` en definiciones
- Prioridad de click en markers: si el click cae sobre un marker visible, bloquea el query WFS de capas
- Click en logo IIEG del sider muestra marcador de MapaLab sobre el instituto con InfoBox (version, contacto, tecnologias)
- Constante global `APP_VERSION` inyectada desde `package.json` via `define` en Vite
- Archivo centralizado `markerDefinitions.js` para definiciones de markers reutilizables
- Script `scripts/sync-version.sh` y pre-commit hook para sincronizar version en README y package-lock
- Documentacion: `docs/zoom.md`, `docs/markers.md`
- Iconos `fit_extent` (normal/hover) para boton de centrar vista

### Cambiado
- Color del punto de geolocalizacion de azul (`#3b82f6`) a naranja (`#f97316`)

## [1.0.10] - 2026-04-13

### Agregado
- Capa "Carencia por calidad y espacios de la vivienda (%)" en Desarrollo Social > Pobreza y vulnerabilidades

## [1.0.9] - 2026-04-13

### Corregido
- `formatNumber` se aplicaba a campos de fecha y folio en InfoBox. Se agrega propiedad `raw` en definiciones de `list` y `cards` para omitir el formateo numerico (aplicado en salud, educacion y recursos)

### Cambiado
- Componente `IconText` del InfoBox: ubicacion abre Google Maps, telefono abre marcador (`tel:`), mejor alineacion de icono y texto, espaciado entre items

## [1.0.8] - 2026-04-13

### Corregido
- Descargas de capas grandes (>1GB) fallaban por timeout de 120s en la cadena de proxies (nginx mapalab y gateway-hub). Timeout aumentado a 600s con `proxy_buffering off` para rutas de descarga
- Primera descarga lenta por cold start del pool de conexiones a PostgreSQL. Se agrega warm-up del pool al iniciar cada worker de Gunicorn

### Cambiado
- Configuracion del pool de conexiones SQLAlchemy con `pool_size=4` y `max_overflow=4`

### Eliminado
- Archivos `.env` remanentes en `frontend/`, `backend/` y `nginx/` (consolidados en `.env.*` raiz desde v1.0.5)

### Agregado
- `docs/context.md` con referencia completa del proyecto para onboarding y contexto en nuevas conversaciones

## [1.0.7] - 2026-04-13

### Eliminado
- Inyeccion de GTM desde el frontend (`main.jsx`), ahora centralizada en gateway-hub via `sub_filter`
- Variables `VITE_GTM_ID` y `VITE_GOOGLE_ANALYTICS_ID` de `.env.example`, `docker-compose.yml` y `Dockerfile`

## [1.0.6] - 2026-04-13

### Cambiado
- Renombrar proyecto Docker Compose de produccion de `mapalab-staging` a `mapalab`

### Agregado
- Target `ensure-networks` en Makefile para crear redes Docker automaticamente antes de deploy/staging/prod

## [1.0.5] - 2026-04-02

### Cambiado
- Unificar Docker Compose: un solo archivo raiz con profiles (dev/staging) reemplaza 4 archivos en subdirectorios
- Centralizar variables de entorno: `.env.example` raiz con `--env-file`, elimina patron fragil de `cp .env.X .env`
- Refactorizar Makefile: comandos simplificados, elimina `cd` por directorio, agrega `make deploy` y `make staging`
- Unificar .gitignore: un solo archivo raiz reemplaza 3 archivos con patrones duplicados
- Unificar backend Dockerfile con multi-stage targets (development/production)
- Extraer workflow reutilizable de test en CI/CD, eliminar duplicacion en 3 workflows

### Agregado
- README.md raiz como punto de entrada del proyecto
- CONTRIBUTING.md con guia de contribucion y convenciones
- CHANGELOG.md con registro de cambios unificado
- CODE_OF_CONDUCT.md adaptado al contexto IIEG
- `.dockerignore` para frontend y backend (optimizar contexto de build)
- `.env.example` raiz consolidado con todas las variables del sistema
- Target `make deploy` para el pipeline de CD
- Target `make staging` para diferenciar staging de produccion
- Workflow reutilizable `.github/workflows/test-frontend.yml`

### Eliminado
- `frontend/docker-compose.dev.yml`, `backend/docker-compose.yaml`, `backend/docker-compose.prod.yaml`, `nginx/docker-compose.yml`
- `frontend/.gitignore`, `backend/.gitignore` (consolidados en raiz)
- `.env.example` de cada subdirectorio (consolidados en raiz)
- `nginx/README.md`, `frontend/README.md`, `backend/README.md` (fusionados en README raiz y docs/)
- `frontend/ARCHITECTURE.md`, `frontend/CODE_OF_CONDUCT.md`, `frontend/CHANGELOG` (fusionados en raiz)
- `backend/Dockerfile.prod` (unificado en Dockerfile con targets)
- Patron fragil de `cp .env.X .env` en Makefile
- Targets `network-create` / `network-remove` del Makefile
- Duplicacion de jobs de test en workflows CI/CD

## [1.0.4] - 2026-04-01

### Agregado
- Marcador de capa seleccionada en la URL mediante prefijo `*` dentro del parametro `layers` (ej: `?layers=limite_iieg,*economia_pib`), permitiendo preservar la seleccion al recargar y compartir enlaces con subtopico pre-seleccionado.
- Aplicacion de filtros de fecha por defecto (`defaultDate`) al inicializar capas desde URL, igualando el comportamiento de activacion desde el sider.
- Indicador de carga inmediato al crear capas WMS, garantizando que el spinner aparezca desde el inicio de la peticion.

### Corregido
- La auto-seleccion de simbologia siempre revertia a "Limites" al recargar, ignorando la capa seleccionada por el usuario. Se corrigio la logica de auto-seleccion en `useSymbology` para respetar selecciones explicitas desde URL.
- Typo en `topicsConfig.js`: el ID `establecimeintos_salud` impedia activar la capa de establecimientos de salud desde los subtopicos del inicio.

## [1.0.3] - 2026-04-01

### Corregido
- El orden de capas activas se invertia al recargar la pagina. Se reemplazo el uso de `onToggleLayer` (que anteponia cada capa al inicio del array) por asignacion directa de IDs respetando el orden de la URL.

## [1.0.2] - 2026-04-01

### Corregido
- Las flechas de navegacion del componente `ScrollContainer` aparecian sin overflow real. Se cambio a renderizado condicional para evitar que el contenido de las flechas inflara el `scrollHeight` del contenedor.

## [1.0.1] - 2026-03-30

### Cambiado
- Simplificacion de infraestructura de 4 modos de despliegue (dev, prod, ssl, ssl-local) a 2 (dev, prod), delegando SSL y proxy de GeoServer al gateway-hub externo.
- Eliminacion de configuraciones Nginx redundantes (nginx.base.conf, nginx.ssl.conf, entrypoint.sh, docker-compose.ssl.yml, conf.d/, includes/, error/, ssl/).
- Eliminacion del stack standalone del frontend (Dockerfile, docker-compose.yml, nginx.conf).
- Simplificacion del Makefile removiendo targets ssl, ssl-local, ssl-down y deploy.
- Comunicacion entre servicios via host IP:port con `extra_hosts: host.docker.internal:host-gateway` para compatibilidad Linux.

### Corregido
- URLs de descarga de metadatos retornaban 404 por prefijo `metadato_` en el nombre de archivo que no existe en el bucket de Acervo. Se remueve el prefijo al construir la URL en el backend.
- Variable `ACERVO_PUBLIC_URL` apuntaba a `host.docker.internal` que el navegador no puede resolver. Corregido a IP del host.

## [1.0.0] - 2026-03-27

### Agregado
- Descarga de capas desde el servidor con componentes frontend y API backend dedicada.
- Cancelacion de descargas de capas en lote con actualizacion de UI.
- Servicio y API dedicados de periodicidad para capas, reemplazando el mecanismo de cache anterior.
- Cache de periodicidad robusto con logica de reintentos y control de fallos consecutivos.
- Modo INEGI para consultas de informacion de features, ajustando dinamicamente columnas de geometria y parametros WMS.
- Componente `ConfirmDropdown` integrado en `ActiveLayersList` y `CloseButton` para estandarizar prompts de confirmacion.
- Boton de cierre en el panel de historial de mediciones con ancho responsive.
- Funcionalidad de finalizar dibujo en herramientas de medicion.
- Iconos SVG dedicados de play/pause para animacion de capas raster con nuevos estilos de boton y estados hover.
- Selector de calidad de exportacion de mapa con dimensiones dinamicas de captura.
- Barra de escala en exportacion de mapa, fuentes de capas, y pie de pagina con disclaimer.
- Minimapa dinamico, soporte de multiples leyendas y composicion PDF mejorada en exportacion.
- Fecha actual en nombres de archivo de mapas exportados, PDFs, imagenes y datos descargados.
- Propiedad `isCategory` para capas y logica de procesamiento asociada.
- Configuraciones detalladas de InfoBox para capas climaticas raster con formato de fecha y precision decimal.
- Etiquetas estaticas en plantillas de tarjetas InfoBox.
- Mejora del esquema de metadatos con campos de descarga, fuentes, metodologia y simbolos de StatCard.
- Capas raster habilitadas por tiempo con funcionalidad de loop y seleccion de fecha mejorada.
- Soporte de despliegue bajo ruta base configurable (`/mapalab/`).
- CORS configurables y headers de seguridad en Nginx del frontend.
- Header sticky con fondo blanco y contenedor interior purpura redondeado.
- Flag `hidePeriodicity` en definiciones de capas para controlar la periodicidad en el modal de detalles.
- Flag `hiddenInMenu` para ocultar capas del menu de temas.
- Subtemas en configuraciones de temas.
- Componente `Message` y hook `useSlowLoading` para mensajes de carga lenta.
- Iconos SVG de advertencia y tooltips responsive en items de capas activas.
- Rediseno de paginas de error y not found.
- Icono de aviso de privacidad y estado de exito de copiado en boton de compartir.
- Atribucion del mapa con funcionalidad hover-to-expand e imagen Open Data.
- Atribucion Creative Commons BY 4.0.
- Helper `formatNumber` para formato consistente con separadores de miles.
- Helper `formatDateString` para formato de fecha de ultima actualizacion.
- Soporte de multiples enlaces externos separados por coma en seccion 'Fuente'.
- Hooks de configuracion para ejecutarse con Docker en modo desarrollo.
- Propiedad `wmsGroup` en configuracion WMS para prevenir merge de requests.
- Posicionamiento sticky de capa activa seleccionada con overlays de fade.
- Panel de simbologia inicializado colapsado con auto-expansion al seleccionar capa.
- Modo zen/mobile en sider con boton de toggle y dropdown de capas base.
- Selector de fecha con auto-seleccion de mes unico y navegacion de carrusel por ano.
- Calculo dinamico de zona UTM para exportacion de mapas.

### Cambiado
- Estandarizacion de IDs de capas en configuraciones de temas y logica de activacion por URL.
- Mejora del posicionamiento sticky de `ScrollContainer` con flexbox.
- Deteccion de overflow de carrusel con `ResizeObserver` en lugar de `setTimeout`.
- Renombrado de campo 'ingresos_propios' a 'porcentaje_ingresos_propios'.
- Consolidacion de URLs de backend y GeoServer en un solo `MAPALAB_BACKEND_URL`.
- Introduccion de variables `BACKEND_HOST` y `NETWORK_NAME`.
- Estandarizacion de estilos de etiquetas con constantes `MUNICIPIO_STYLE` y `CARACTERISTICA_STYLE`.
- Renombrado del modo 'zen' a 'mobile' en sider.
- Asignacion de `wmsGroup` especificos a capas en lugar de 'default'.
- Eliminacion de debouncing en filtros WMS y actualizaciones de capas activas.
- Integracion de filtrado CQL dinamico directamente en el WMS layer manager.
- Extraccion de secciones de informacion de capa en componente `LayerInfoSections`.
- Eliminacion de `BaseLayersDropdown` y su uso en `ActiveLayersList`.
- Eliminacion de GeoJSON de formatos de descarga vectorial disponibles.
- Estandarizacion de definiciones de capas de seguridad y actualizacion de `RASTER_YEAR`.

### Corregido
- Procesamiento correcto de `metadata.metadato` como array u objeto individual al agregar archivos al zip.
- Reduccion del cooldown de `LayerDetailModal` de 60 a 5 segundos.
- Manejo de null y undefined en utilidad `toArray` y procesamiento de campos `renderCard`.
- Errores gramaticales y de acentuacion en nombres de capas de robo.
- Nombres de display de capas de limite municipal en `HIDDEN_LAYERS`.
- Resolucion de URL de endpoint de metadatos relativa al origin.
- Renderizado del variante menu de Panel usando `createPortal` a `document.body`.

### Rendimiento
- File locking para generacion atomica de cache y connection pooling de base de datos.
- Memoizacion del calculo `isInegiMode` con `useMemo`.
- Headers de seguridad, compresion gzip, timeouts de proxy aumentados e includes modulares en Nginx.
- Cache de proxy Nginx para GeoServer con bypass por request.
- Capas WMS tileadas para mejor rendimiento de carga.

## [0.9.5] - 2026-02-06

### Agregado
- Selector de fecha en detalles de capa con opcion de modo avanzado.
- Mejora en generador de filtros CQL para ignorar claves internas (prefijadas con `_`).
- Actualizacion de capa base 'Cuerpos de agua' a resolucion 50k para mejor detalle.

### Cambiado
- Refactorizacion completa del servicio de metadatos de capa para buscar por workspace y capa.
- Eliminacion del servicio de periodicidad obsoleto.
- Ajuste de offsets en `InfoBox` y mejora en deteccion de posicion de click (`originalEvent`).

## [0.9.4] - 2026-01-12

### Agregado
- Estado de carga (`isLoading`) para seguimiento de progreso en busquedas.

### Cambiado
- Implementacion de estilos visuales segun mockup para paneles de simbologia, descargas y medidas.
- Configuracion de logging para mejor compatibilidad con Docker.
- Implementacion de nuevos iconos de control de mapa (zoom, centro) con estados hover.
- Limpieza de `Makefile` para eliminar contenedores huerfanos en `docker compose down`.

## [0.9.3] - 2025-12-15

### Corregido
- Expansion y refinamiento de definiciones de subcapas en categorias de demografia, desarrollo social y economia.
- Exposicion del puerto del backend al host.

### Cambiado
- Cambio de nombre de funcion en la fabrica de base de datos.
- Estandarizacion de nombres de proyectos docker-compose en diferentes entornos.
- Limpieza de `Makefile` y `README` (eliminacion de emojis), y limpieza de archivos `.gitignore`.

## [0.9.2] - 2025-12-11

### Agregado
- Implementacion de la version inicial de la aplicacion interactiva Mapalab con componentes completos de frontend y backend.

### Cambiado
- Contenedorizacion del proceso de construccion del frontend y simplificacion de la configuracion de Nginx.

## [0.9.1] - 2025-11-12

### Agregado
- Configuracion completa de Vitest para testing del proyecto.
- Scripts npm para testing: `npm test`, `npm run test:ui`, `npm run test:coverage`.
- Soporte para cobertura de codigo con `@vitest/coverage-v8`.

## [0.9.0] - 2025-11-12

### Agregado
- Hook `useAutoCleanFilters` para limpieza automatica de filtros al eliminar capas.
- Funcion `isRenderableParentLayer` en layerHelpers para detectar capas padre renderizables.

### Rendimiento
- Reduccion del tiempo de carga de filtros desde URL de 400ms a 150ms (~62% mas rapido).
- Eliminacion de setTimeout anidados innecesarios en la inicializacion de filtros.

## [0.8.3] - 2025-11-11

### Cambiado
- Actualizacion de configuracion de capas para utilizar filtros CQL en lugar de estilos.

## [0.8.2] - 2025-11-10

### Agregado
- Sistema de sincronizacion bidireccional de filtros con la URL.
- Hook `useFilterUrlSync` para sincronizacion automatica filtros -> URL.
- Hook `useInitializeFiltersFromUrl` para carga de filtros desde URL.

## [0.8.2-beta] - 2025-11-07

### Agregado
- Componente de periodicidad en el modal de detalles de capas.
- Concatenacion de filtros CQL para parametro de periodicidad.

### Corregido
- Problema de multiple informacion al seleccionar un punto en el mapa.
- Tipo de capa para homologar con GeoServer.

## [0.8.1-patch] - 2025-11-06

### Corregido
- Problema de recarga de parametros de la URL al desmarcar capas.
- Mejora de contrastes en componentes de UI.

## [0.8.1] - 2025-10-07

### Agregado
- Implementacion del hook useLayerUrlSync.
- Helper handleShare para copiar la URL.

## [0.8.0] - 2025-10-07

### Agregado
- Frame al descargar el mapa con norte, escala grafica, leyenda, fecha y coordenadas.
- Utils: coordinateGrid, coordinateLabels, layoutFooter, layoutHeader, northArrow, symbology, symbologyData.

## [0.7.7] - 2025-09-24

### Agregado
- Implementacion del Footer en la pagina de inicio.

## [0.7.6] - 2025-09-24

### Agregado
- Implementacion de Support Section y Select Section en la pagina de inicio.

## [0.7.5] - 2025-09-30

### Agregado
- Implementacion de GuideSection en la pagina de inicio.
- Componente PrimaryButton dinamico.

## [0.7.4] - 2025-10-02

### Agregado
- Configuracion del servidor WMS para conexion con servicios de mapas externos.
- Soporte para capas WMS en el visualizador de mapas.
- Sistema de autenticacion para servicios WMS protegidos.
- Cache local para capas WMS frecuentemente utilizadas.

## [0.7.3] - 2025-09-25

### Agregado
- Topic section con tematicas y busqueda por palabra clave.
- Componentes: TopicSection, Card, CardResponsive.

## [0.7.2] - 2025-09-24

### Agregado
- Implementacion de la Hero Section en la pagina de inicio.

## [0.7.1] - 2025-09-23

### Agregado
- Header de la plataforma con opciones dinamicas.
- Hamburger menu para dispositivos moviles.

## [0.7.0] - 2025-09-04

### Agregado
- Sistema de paneles colapsables para capas activas y simbologia.
- Hooks: useActiveLayersLogic, useLayerCollapse, useLayerDragDrop.
- Funcionalidad drag & drop para reordenar capas activas (Z-index).

### Cambiado
- Refactorizacion completa de MapsProvider y ActiveLayersList.

## [0.6.8] - 2024-06-11

### Agregado
- Funcionalidad para compartir mapas mediante enlaces directos.
- Soporte para capas personalizadas de usuario.

## [0.5.5] - 2024-01-09

### Agregado
- Nuevas opciones de filtrado de datos.
- Caracteristicas interactivas de leyenda.
- Capacidades avanzadas de busqueda.

## [0.5.1] - 2025-08-22

### Cambiado
- Actualizacion de la estructura del proyecto.

## [0.1.0] - 2025-08-10

### Agregado
- Configuracion inicial del proyecto.
- Estructura basica del frontend con React.
- Componentes de integracion de mapas.
