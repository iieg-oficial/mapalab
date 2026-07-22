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

- `app/routers/catalogo.py` + `repositories/catalogo_repository.py` + `services/catalogo_service.py` (cache en memoria TTL 5 min, `Cache-Control: public, max-age=300`). Devuelve `geoserverWorkspace` resuelto para armar WMS/WFS y `littleCard` (config `infobox_config` heredada de `mapalab.layers` vía `LEFT JOIN LATERAL`, para la tarjeta de información por clic).
- **Descargas**: GPKG/SHP directo a GeoServer (WFS por el gateway); CSV por `/download` (que ahora **excluye columnas geométricas** — cambio transversal que también afecta a las capas normales; para geometría, GPKG). Ver `services/downloadService.js` → `downloadCatalogoCapa`.

## Vista (frontend)

`src/pages/catalogo/` — fuera de `MapsProvider`/`LayersProvider` (sin árbol, sin CQL, sin eventos). Mapa Voyager + relieve; encuadra al **bbox real de la capa** vía `getLayerExtent3857` (mismo servicio que el `centerOnLayer` del visor). **Recicla** componentes del visor con contextos stub: `MapControls` (zoom/ubicación), `ScaleLineControl`, `MapAttribution` (prop `hideActions` para ocultar Colibrí/entrada; prop `extraRight` para insertar el botón de información) y `MeasurementTools` (dibujo/medición vía `useMapDrawing`/`useMapEditing`, expuesto en `CatalogoTools`). Buscador desplegable (nombre + `search_tags`), panel de leyendas con descarga colapsable, logo→inicio y botón `<` que restaura la URL previa del visor (`sessionStorage`).

- **Información por clic** (`CatalogoInfoBox`): clic sobre la capa activa consulta `GetFeatureInfo` de GeoServer y renderiza una tarjeta con `renderCard` del visor, usando `littleCard` (config heredada de `mapalab.layers`).
- **Botón de información**: vive en la barra de atribuciones (a la derecha de "Contribuciones") vía `extraRight`; en el primer ingreso su tooltip se auto-despliega (`useFeatureSeen`).

## Entradas desde el visor

Dos botones ("Catálogo"): flotante junto a Contribuciones y en el sider bajo el selector de modo. **Gateados** a `VITE_APP_ENV ∈ {dev,beta}` (`IS_NON_PROD`) → ocultos en producción; la ruta `/catalogo` funciona por URL directa.

## Alta de capas (mariachi admin)

Subpágina "Catálogo" (grupo Mapalab), sin tabs. Botonera con tres acciones que despliegan un **panel inline** (no modal) debajo:

- **Agregar capa** (`CapaFormPanel`): form guiado por GeoServer (elige workspace → capa; `nombre`/`slug` se autocompletan del título/nombre y son opcionales; etiquetas con autocompletado). También se abre con **doble clic** en una fila para editar.
- **Importar workspace** (`ImportWorkspacePanel`): importa de golpe todas las capas nuevas de un workspace (lee **WMS GetCapabilities** para nombres+títulos).
- **Agregar múltiples capas** (`BulkAddPanel`): `Transfer` de dos paneles para mover capas dentro/fuera del catálogo.

La tabla tiene **filtros por columna** (búsqueda en nombre/slug/capa, filtro por lista en workspace/etiquetas/habilitada) y **selección múltiple** (checkboxes) con barra de acciones: **eliminar** en lote y **etiquetar** (suma etiquetas a las seleccionadas vía PUT parcial `searchTags`); la edición por doble clic se deshabilita mientras hay selección activa. El alta valida contra GeoServer.

## Despliegue

Aplicar la migración **antes** de los backends (sin la tabla, los endpoints dan 500). Ver `RUNBOOK.md` → "Catálogo de capas (Mapalab)".
