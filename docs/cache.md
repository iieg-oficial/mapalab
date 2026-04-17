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
| `loopDataRef` | `hooks/useRasterLoop.js:10` | Estado de animacion raster (mes/ano actual) | Mientras loop activo | `cleanupLoop` al desactivar capa |
| `timersRef` | `hooks/useRasterLoop.js:11` | Map de `setTimeout` handles | Duracion del loop | `clearTimer()` / cleanup |
| `appliedDefaultsRef` | `hooks/useRasterLoop.js:12` | Set de capas con default date aplicado | Sesion | Remove al desactivar capa |
| `cachedResults` en measurements | `hooks/useMapDrawing.js:575,606,613` | Features WFS del poligono de seleccion | Vive con la medicion en el array `measurements` | Usuario borra la medicion |
| `measurements` | `hooks/useMapDrawing.js:12` | Array de selecciones/poligonos con geometria + results cacheados | Sesion | `clearDrawings()` o usuario elimina entrada |

### Module-level (`const obj = {}`)

| Cache | Ubicacion | Datos | Lifecycle | Invalidacion |
|---|---|---|---|---|
| `geometryColumnCache` | `utils/featureInfoUtils.js:2` | Mapeo `URL:tipo → columna geometria` de WFS DescribeFeatureType | Vida del proceso (sin limite) | Manual (nunca hoy) |
| `geometryTypeCache` | `utils/featureInfoUtils.js:3` | Mapeo `URL:tipo → tipo geometrico` | Vida del proceso (sin limite) | Manual |

> **Nota**: estos dos caches son globales y sin TTL. En sesiones muy largas crecen indefinidamente. Candidato a migrar a `WeakMap` o limitar con LRU si el set de capas crece mucho.

---

## Frontend — persistencia (sessionStorage)

| Cache | Ubicacion | Datos | Lifecycle | Invalidacion |
|---|---|---|---|---|
| `message_closed_*` | `components/Message.jsx:30` | Flag boolean: mensaje ya cerrado en esta sesion | Hasta cerrar pestana | Manual via click en cerrar |
| `test-env-modal-dismissed` | `components/TestEnvModal.jsx:5` | Flag: modal beta rechazado | Hasta cerrar pestana | Checkbox "no mostrar de nuevo" |

No hay uso de `localStorage` hoy. Si un dato debe persistir entre sesiones, `localStorage` o IndexedDB serian los siguientes candidatos.

---

## Backend — Python (FastAPI)

| Cache | Ubicacion | Datos | Lifecycle | Invalidacion |
|---|---|---|---|---|
| `DatabaseFactory._connections` | `backend/app/databases/factory.py:7` | Pool de conexiones `PostgresConnection` por tipo de DB | Vida del worker Gunicorn | Al cerrar worker |
| `WORKSPACE_SCHEMA_MAP` | `backend/app/consts/workspaces.py:1` | Mapa workspace → schema PostgreSQL | Compile-time | Modificar constante en codigo |
| `public.layer_periodicity` (tabla DB) | `backend/app/services/periodicity_service.py:10-14` | JSONB de periodicidad calculada por capa | Vive en PostgreSQL hasta proximo refresh | Scheduler APScheduler diario 3:00 AM (Mexico City) o trigger manual `refresh_layer_periodicity()` |

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

Evitar siempre: caches de modulo sin TTL ni limite (como los `geometryColumnCache`/`geometryTypeCache` actuales — son deuda tecnica).

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

1. **`geometryColumnCache` / `geometryTypeCache`** globales sin TTL → migrar a `WeakMap` o limitar con LRU
2. **`measurements[].cachedResults`** crece sin limite → considerar limitar a ultimos N
3. **Falta indice** en `public.layer_periodicity.layer_key` para lookups batch rapidos
4. **No hay Redis** — si empezamos a necesitar cache cross-worker en backend (ej. periodicity en memoria caliente), Redis seria el siguiente paso
