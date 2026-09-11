# Cache en MapaLab

Inventario centralizado de todos los mecanismos de cache del proyecto: memoria frontend, storage, backend, nginx y assets. Incluye lifecycle, invalidacion y criterios para decidir donde meter un cache nuevo.

## Principios

- **Un cache por responsabilidad.** No duplicar datos entre capas sin razon.
- **Lifecycle claro.** Cada cache documenta cuando se limpia.
- **Automatico antes que manual.** Preferir limpieza por lifecycle (unmount, dependencia, ruta) antes que botones "limpiar cache".
- **En memoria si el dato se regenera facil.** `sessionStorage`/DB solo si el recompute es caro o cross-session.

---

## Frontend — caches en memoria

### Estado de React (`useState` / `useRef`)

| Cache | Ubicacion | Datos | Lifecycle | Invalidacion |
|---|---|---|---|---|
| `alternativeResults` | `MapsProvider` state → `selectedFeatureInfo.alternativeResults` | Full feature-info de capas activas no-primarias en el punto clickeado | Mientras el InfoBox este abierto | Se limpia al cerrar InfoBox, nuevo click, o cambio de `activeLayerIds`/`filters` (ver `InfoBox.jsx` useEffect) |
| `usePeriodicityCache` | `hooks/usePeriodicityCache.js:5` | Years/months/days disponibles por capa (response de `getLayersPeriodicities`) | Sesion activa; refetch solo para IDs nuevos | Automatica al cambiar `activeLayerIds` |
| `wmsLayersRef` | `hooks/useWMSLayerManager.js:12` | Map de `TileWMS` de OpenLayers ya construidas | Sesion; cleanup al desmontar | Al desactivar capa elimina entrada |
| `wmsConfigCache` | `hooks/useWMSLayerManager.js:30` | Set de IDs con WMS activo (lookup rapido) | Debounce 30ms sobre `activeLayerIds` | Recalcula por cambio de capas |
| `layerOpacities` | `hooks/useLayerOpacity.js:4` | Map `layerId → opacity` | Sesion | Sync con `activeLayerIds`, reset manual |
| `loopDataRef` | `hooks/useDateLoop.js:17` | Estado de animacion temporal (mes/ano actual) | Mientras loop activo | `cleanupLoop` al desactivar capa |
| `timersRef` | `hooks/useDateLoop.js:18` | Map de `setTimeout` handles | Duracion del loop | `clearTimer()` / cleanup |
| `appliedDefaultsRef` | `hooks/useDateLoop.js:19` | Set de capas con default date aplicado | Sesion | Remove al desactivar capa |
| `cachedResults` en measurements | `hooks/useMapDrawing.js:575,606,613` | Features WFS del poligono de seleccion | Vive con la medicion en el array `measurements` | Usuario borra la medicion |
| `measurements` | `hooks/useMapDrawing.js:12` | Array de selecciones/poligonos con geometria + results cacheados | Sesion | `clearDrawings()` o usuario elimina entrada |

### Module-level (`const obj = {}`)

| Cache | Ubicacion | Datos | Lifecycle | Invalidacion |
|---|---|---|---|---|
| `geometryColumnCache` | `utils/featureInfoUtils.js:5` | Mapeo `URL:tipo → columna geometria` de WFS DescribeFeatureType | Vida del proceso, limitado a 500 entradas | LRU por insercion (al llegar a `MAX_GEOMETRY_CACHE_SIZE` evicta la mas antigua) |
| `geometryTypeCache` | `utils/featureInfoUtils.js:6` | Mapeo `URL:tipo → tipo geometrico` | Vida del proceso, limitado a 500 entradas | LRU por insercion |
| `negativeCache` | `utils/featureInfoUtils.js:7` | Mapeo `URL:tipo → expiresAt` para typenames con `DescribeFeatureType` fallido o ausente en la respuesta | TTL de 60s (`NEGATIVE_TTL_MS`) | Auto-evicta al consultarse despues de la expiracion. Evita reintentos en bucle contra GeoServer 429 |
| `inflightByKey` | `utils/featureInfoUtils.js:8` | Mapeo `URL:tipo → Promise` de la peticion en curso, para dedupe entre consumers concurrentes (`useAlwaysOnTopPinning` + `LayerDetailModal` + `featureInfoService`) | Hasta que la peticion resuelve | Se elimina la entrada al terminar el batch |
| `pendingByUrl` + `resolversByKey` | `utils/featureInfoUtils.js:9-10` | Buffer de typenames pendientes por `baseUrl` que `queueMicrotask(flushBatch)` agrupa en un solo `DescribeFeatureType` con `TYPENAME=a,b,c,...` | Un microtask (las llamadas sincronas del mismo tick se baten juntas) | Se vacian al disparar el batch |
| `eventos`, `home` (eventosService) | `services/eventosService.js:8` | Respuesta de `/api/mapalab/eventos` y `/api/mapalab/home` (de mariachi) | TTL de 24 horas + vida del proceso; dedupe de in-flight con `eventosInFlight`/`homeInFlight` | Doble mecanismo: (1) Watcher de `cache-version` cada 30s mientras la pestana es visible — se vacia cuando cambia el token de version y dispara `mapalab:eventos-changed` o `mapalab:home-changed`; (2) TTL de 24h como safety net — timestamps `eventosTimestamp`/`homeTimestamp` se verifican con `isCacheValid()` antes de retornar datos. Al recargar la pagina, la cache de memoria se limpia automaticamente. |

---

## Frontend — persistencia (sessionStorage)

| Cache | Ubicacion | Datos | Lifecycle | Invalidacion |
|---|---|---|---|---|
| `message_closed_*` | `components/Message.jsx:30` | Flag boolean: mensaje ya cerrado en esta sesion | Hasta cerrar pestana | Manual via click en cerrar |

## Frontend — persistencia (localStorage)

| Cache | Ubicacion | Datos | Lifecycle | Invalidacion |
|---|---|---|---|---|
| `mapalab.annotations` | `hooks/useMapDrawing.js` + `helpers/annotationsSerialization.js` | Mediciones y anotaciones serializadas (geometria EPSG:4326, tipo, estilo: `fillColor`/`bgColor`/`size`/`symbol`). Cap `ANNOTATIONS_MAX_BYTES` (200 KB) | Entre sesiones, hasta limpiar | Se escribe en cada cambio de `measurements`; se borra al quedar vacio o al cerrar con la X. Si la URL trae `?s=` se omite la hidratacion local (el share manda) |

Otras claves de preferencias de UI tambien usan `localStorage` (p. ej. colapso de la barra de herramientas `mapalab.tools.collapsed`, orientacion del swipe `mapalab.swipe.orientation`, visibilidad de leyendas `mapalab.activeLayers.legendsVisible`).

---

## Backend — Python (FastAPI)

| Cache | Ubicacion | Datos | Lifecycle | Invalidacion |
|---|---|---|---|---|
| `DatabaseFactory._connections` | `backend/app/databases/factory.py:7` | Pool de conexiones `PostgresConnection` por tipo de DB | Vida del worker Gunicorn | Al cerrar worker |
| `WORKSPACE_SCHEMA_MAP` | `backend/app/consts/workspaces.py:1` | Mapa workspace → schema PostgreSQL (**legacy**: nueva fuente es `mapalab.workspaces`) | Compile-time | Modificar constante en codigo |
| `public.layer_periodicity` (tabla DB) | fn `public.refresh_layer_periodicity()` | JSONB de periodicidad calculada por capa | Vive en PostgreSQL hasta proximo refresh | **Cron en `dataengine-jobs` container diario 3:00 AM** o `make refresh` (opcion `periodicity`) |
| `mapalab.layer_tree_cache` (tabla DB) | `backend/app/services/layer_tree_service.py` | JSONB del arbol completo de capas (singleton, 250 nodos, ~30KB JSONB) | Hasta proximo refresh | Cron `dataengine-jobs` diario 4:00 AM, `POST /layers/refresh-cache` (HTTP), o `make refresh-layer-tree` |
| `_MEM_CACHE` del tree | `backend/app/services/layer_tree_service.py` | tree + etag + initial_order + workspaces + `checked_at` en memoria del proceso | TTL de 30s (`_MEM_TTL_SECONDS`): mientras este fresco sirve de memoria **sin tocar la DB**; al expirar revalida solo el `etag` (query liviano) sin traer el arbol. Se rehidrata desde DB si esta vacio | ETag mismatch al revalidar o `POST /layers/invalidate-cache`. **Stale-while-error:** si la DB falla o esta lenta, sigue sirviendo el ultimo arbol bueno en vez de propagar el error |
| `mapalab.layer_stats.values` (tabla DB) | fn via `run_refresh_layer_stats.py` | Numeralia calculada ejecutando `stats_config` queries | `ttl_minutes` column (default 1440) | Cron `dataengine-jobs` diario 4:30 AM o `make refresh` (opcion `layer-stats`) |
| `_cache` del catalogo | `backend/app/services/catalogo_service.py` | Capas e instituciones del catalogo, serializadas y cacheadas por separado en memoria del proceso | TTL de 300s (`_TTL_SECONDS`) | `POST /catalogo/invalidate-cache` (token interno), que mariachi llama en cada escritura del catalogo. Sin esa llamada un alta tardaba hasta 5 min en verse |

El backend no usa Redis ni memcached. El cache mas "real" es `layer_periodicity`: se calcula una vez al dia y vive en DB.

---

## Nginx / Gateway — cache HTTP

### MapaLab nginx (`nginx/nginx.conf`)

| Regla | Rutas | Header | Lifecycle |
|---|---|---|---|
| Assets con hash | `*.js`, `*.css`, `*.png`, `*.svg`, `*.woff`, etc. (`nginx/nginx.conf:25-29`) | `expires 1y; Cache-Control: public, immutable` | 1 ano (hash rompe cache automaticamente) |
| `index.html` | `/index.html` (`nginx/nginx.conf:31-33`) | `Cache-Control: no-cache, no-store, must-revalidate` | Sin cache (siempre revalida) |

Los proxy a backend (`/api/`) no usan `proxy_cache`.

### gateway-hub (externo al repo)

- Cache de `/mapalab/assets/` (500MB, 7 dias, stale serving en errores)
- Cache de `/geoserver/` (2GB, 6h TTL)
- Ver `/IIEG/gateway-hub/docs/rendimiento.md` (repo aparte) para detalles

---

## Assets y build

| Mecanismo | Proposito |
|---|---|
| Vite content hashing | Archivos tipo `app.a3f2b1.js` — el hash cambia si el contenido cambia, permitiendo `immutable` cache seguro |
| `defer CSS plugin` (`vite.config.js:24-34`) | Reescribe `<link rel="stylesheet">` a preload + noscript para no bloquear render |

No es "cache" en el sentido estricto, pero es la estrategia que hace que el `expires 1y` del nginx sea seguro.

---

## Flujos con cache inter-capas

### Click en el mapa → InfoBox → alternativa

```
1. Usuario clickea punto P en el mapa
2. queryFeatures pide GetFeatureInfo al GeoServer para capa primaria
   - Si hay resultados → setSelectedFeatureInfo con results + queriedLayerName
   - Si NO hay → consulta capas activas restantes y guarda:
       - alternativeLayers (grouped counts para el UI)
       - alternativeResults (cache completo de features)
3. UI muestra EmptySuggestions con los "contadores" por capa
4. Usuario tap una capa alternativa
5. selectAlternativeLayer FILTRA alternativeResults en memoria (sin red) y:
   - setea selectedLayerForSymbology
   - actualiza selectedFeatureInfo.results con el subset
   - limpia alternativeLayers (ya no hay que ofrecer mas alternativas)
6. InfoBox re-renderiza mostrando los features reales
```

Invalidacion del cache: el `useEffect` en `InfoBox.jsx` escucha `activeLayerIds` y `filters`. Si cambia cualquiera, limpia `alternativeLayers` + `alternativeResults` porque la data ya no refleja el estado del mapa.

### Seleccion por poligono

Patron similar: `useMapDrawing` guarda `cachedResults` en la medicion. Re-consultar la misma seleccion por el historial usa el cache. Invalidacion: usuario borra la medicion.

---

## Guia rapida: donde meter un cache nuevo

| Pregunta | Si → | No → |
|---|---|---|
| ¿Vida limitada al InfoBox/seleccion activa? | State del context (`selectedFeatureInfo.*`) | Sigue |
| ¿Vida limitada al componente que lo usa? | `useState`/`useRef` local | Sigue |
| ¿Cross-componente, sesion actual, dato barato? | Hook context (`usePeriodicityCache` como modelo) | Sigue |
| ¿Cross-sesion pero regenerable? | `sessionStorage`/`localStorage` | Sigue |
| ¿Caro de calcular, usado por multiples usuarios? | Backend: tabla DB con refresh scheduled (como `layer_periodicity`) | Reevaluar |

Evitar siempre: caches de modulo sin TTL ni limite. Si la fuente puede fallar (429, red, payload incompleto), agregar siempre `negativeCache` con TTL corto y `inflightByKey` para dedupe — patron en uso en `utils/featureInfoUtils.js`.

---

## Limpieza — patrones en uso

| Patron | Usado en |
|---|---|
| **Lifecycle automatico** (unmount, context reset) | Todos los `useRef`/`useState` |
| **Dependency-driven** (`useEffect([deps])`) | `alternativeResults` cleanup, `usePeriodicityCache`, `wmsConfigCache` |
| **User-triggered** (boton/tap) | `measurements` (borrar seleccion), `message_closed_*` |
| **Scheduled** (cron) | `layer_periodicity` (APScheduler 3AM) |
| **Hash-based** (no invalida, se reemplaza) | Vite assets |

---

## Deuda tecnica identificada

1. **`measurements[].cachedResults`** crece sin limite → considerar limitar a ultimos N
2. **No hay Redis** — si empezamos a necesitar cache cross-worker en backend (ej. periodicity en memoria caliente), Redis seria el siguiente paso

> `public.layer_periodicity.layer_key` ya tiene indice automatico por la `PRIMARY KEY`, los lookups `= ANY(keys)` del batch lo aprovechan sin configuracion extra.
