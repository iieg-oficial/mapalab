# Catálogo (`/catalogo`)

Vista pública simplificada del visor para **explorar y descargar capas sueltas** del IIEG por descarga directa. Las capas se dan de alta explícitamente desde mariachi (no derivan del árbol principal `mapalab.layers`). Antes se llamó "Complementarias".

## Arquitectura (3 repos)

| Capa | Repo | Qué hace |
| --- | --- | --- |
| Datos | **dataengine** | Tabla `mapalab.catalogo_capas` (migración `0025_catalogo_capas`). |
| Escritura / admin | **mariachi** | CRUD + alta masiva (`/catalogo`, `/catalogo/bulk`) y subpágina admin "Catálogo". |
| Lectura pública | **mapalab/backend** | `GET /catalogo/capas` y `/catalogo/capas/{slug}`. |
| Vista | **mapalab/frontend** | Rutas `/catalogo` y `/catalogo/:slug`. |

Reparte igual que `mapalab.layers`: mariachi escribe, mapalab-backend lee (público), dataengine es dueño de la tabla y su migración.

## Modelo de datos

`mapalab.catalogo_capas`: `workspace_alias` + `geoserver_layer` (el `geoserver_workspace` real se resuelve al leer, igual que `layers`), `enabled` (visibilidad en el catálogo, **no** toca GeoServer) + `deleted_at` (papelera / soft-delete), `search_tags TEXT[]`, timestamps, `updated_by`. Índice **único parcial** de `slug` (`WHERE deleted_at IS NULL`).

## Backend público (mapalab)

- `app/routers/catalogo.py` + `repositories/catalogo_repository.py` + `services/catalogo_service.py` (cache en memoria TTL 5 min, `Cache-Control: public, max-age=300`). Devuelve `geoserverWorkspace` resuelto para armar WMS/WFS.
- **Descargas**: GPKG/SHP directo a GeoServer (WFS por el gateway); CSV por `/download` (que ahora **excluye columnas geométricas** — cambio transversal que también afecta a las capas normales; para geometría, GPKG). Ver `services/downloadService.js` → `downloadCatalogoCapa`.

## Vista (frontend)

`src/pages/catalogo/` — fuera de `MapsProvider`/`LayersProvider` (sin árbol, sin CQL, sin eventos). Mapa Voyager + relieve; encuadra al **bbox real de la capa** vía `getLayerExtent3857` (mismo servicio que el `centerOnLayer` del visor). **Recicla** componentes del visor con contextos stub: `MapControls` (zoom/ubicación), `ScaleLineControl` y `MapAttribution` (nuevo prop `hideActions` para ocultar Colibrí/entrada). Buscador desplegable (nombre + `search_tags`), panel de leyendas con descarga colapsable, logo→inicio y botón `<` que restaura la URL previa del visor (`sessionStorage`).

## Entradas desde el visor

Dos botones ("Catálogo"): flotante junto a Contribuciones y en el sider bajo el selector de modo. **Gateados** a `VITE_APP_ENV ∈ {dev,beta}` (`IS_NON_PROD`) → ocultos en producción; la ruta `/catalogo` funciona por URL directa.

## Alta de capas (mariachi admin)

Subpágina "Catálogo" (grupo Mapalab): tabla CRUD con form guiado por GeoServer (elige workspace → capa; `nombre`/`slug` se autocompletan del título/nombre y son opcionales; etiquetas con autocompletado) y pestaña **"Alta por workspace"** con `Transfer` de dos paneles + "Importar todo" (lee **WMS GetCapabilities** del workspace para nombres+títulos de golpe). El alta valida contra GeoServer.

## Despliegue

Aplicar la migración **antes** de los backends (sin la tabla, los endpoints dan 500). Ver `RUNBOOK.md` → "Catálogo de capas (Mapalab)".
