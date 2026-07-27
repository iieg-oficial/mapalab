# Catálogo (`/catalogo`)

Vista pública simplificada del visor para **explorar y descargar capas sueltas** del IIEG por descarga directa. Las capas se dan de alta explícitamente desde mariachi (no derivan del árbol principal `mapalab.layers`). Antes se llamó "Complementarias".

## Arquitectura (3 repos)

| Capa | Repo | Qué hace |
| --- | --- | --- |
| Datos | **dataengine** | Tablas `mapalab.catalogo_capas` (migración `0025_catalogo_capas`) y `mapalab.catalogo_instituciones` (`0028_catalogo_instituciones`). |
| Escritura / admin | **mariachi** | CRUD + alta masiva (`/catalogo`, `/catalogo/bulk`) y subpágina admin "Catálogo". |
| Lectura pública | **mapalab/backend** | `GET /catalogo/capas`, `/catalogo/capas/{slug}` y `/catalogo/instituciones`. |
| Vista | **mapalab/frontend** | Rutas `/catalogo`, `/catalogo/:seg1` y `/catalogo/:seg1/:seg2`. |

Reparte igual que `mapalab.layers`: mariachi escribe, mapalab-backend lee (público), dataengine es dueño de la tabla y su migración.

## Modelo de datos

`mapalab.catalogo_capas`: `workspace_alias` + `geoserver_layer` (el `geoserver_workspace` real se resuelve al leer, igual que `layers`), `enabled` (visibilidad en el catálogo, **no** toca GeoServer) + `deleted_at` (papelera / soft-delete), `search_tags TEXT[]`, `institucion_id` (FK opcional), timestamps, `updated_by`. Índice **único parcial** de `slug` (`WHERE deleted_at IS NULL`).

`mapalab.catalogo_instituciones`: `slug`, `nombre`, `logo_url` (opcional, se ve en la lista desplegable del visor y se elige con el `BucketFilePicker` del Acervo desde mariachi), `orden` (orden de las pills), `deleted_at`, timestamps, `updated_by`. Mismo índice único parcial de `slug`. Al borrar una institución sus capas quedan con `institucion_id = NULL` (no se borran).

## Rutas y namespace de slugs

Capas e instituciones **comparten namespace**, así que las URLs son cortas y la resolución ocurre en cliente contra las listas que la página ya carga:

| URL | Resuelve a |
| --- | --- |
| `/catalogo` | Todas las capas |
| `/catalogo/pozos` | Capa suelta |
| `/catalogo/sader` | Modo institución |
| `/catalogo/sader/pozos` | Capa dentro de la institución |

`resolveCatalogoRoute` (`pages/catalogo/helpers/catalogoRoutes.js`) decide: con dos segmentos, el primero es institución; con uno, gana la capa si el slug existe en ambos lados (compatibilidad con enlaces ya compartidos). Para que ese desempate no haga falta, `capas_catalogo_service.py` en mariachi valida el slug **contra las dos tablas** al crear o editar capas e instituciones, incluida la generación automática del alta masiva.

Si el slug no existe en ninguna de las dos listas se abre el buscador y se emite `catalogo_slug_not_found`.

## Backend público (mapalab)

- `app/routers/catalogo.py` + `repositories/catalogo_repository.py` + `services/catalogo_service.py` (cache en memoria TTL 5 min por colección, `Cache-Control: public, max-age=300`). Devuelve `geoserverWorkspace` resuelto para armar WMS/WFS, `littleCard` (config `infobox_config` heredada de `mapalab.layers` vía `LEFT JOIN LATERAL`, para la tarjeta de información por clic) e `institucion` (`{slug, nombre}` o `null`).
- `GET /catalogo/instituciones` devuelve solo las instituciones **con al menos una capa habilitada**, ordenadas por `orden, nombre` — así las pills nunca muestran un filtro que daría lista vacía.
- `POST /catalogo/invalidate-cache` (requiere `X-Internal-Token`) vacía el cache en memoria. Mariachi lo invoca tras cada escritura del catálogo; sin él, un alta tardaba hasta 5 minutos en verse en el visor.
- **Descargas**: capas vectoriales en GPKG/SHP directo a GeoServer (WFS por el gateway) y CSV por `/download` (que **excluye columnas geométricas** — cambio transversal que también afecta a las capas normales; para geometría, GPKG). Capas raster en **GeoTIFF** (WCS con `SUBSET=time` de la fecha activa). El CSV cacheado lo sirve el backend por **streaming interno** del Acervo (no redirige a una URL prefirmada; ver `RUNBOOK.md`). Ver `services/downloadService.js` → `downloadCatalogoCapa`.

## Vista (frontend)

`src/pages/catalogo/` — fuera de `MapsProvider`/`LayersProvider` (sin árbol, sin CQL, sin eventos). Mapa Voyager + relieve; encuadra al **bbox real de la capa** vía `getLayerExtent3857` (mismo servicio que el `centerOnLayer` del visor). **Recicla** componentes del visor con contextos stub: `MapControls` (zoom/ubicación), `ScaleLineControl`, `MapAttribution` (prop `hideActions` para ocultar Colibrí/entrada; prop `extraRight` para insertar el botón de información) y `MeasurementTools` (dibujo/medición vía `useMapDrawing`/`useMapEditing`, expuesto en `CatalogoTools`). Buscador desplegable (nombre + `search_tags`), panel de leyendas con descarga colapsable, logo→inicio y botón `<` que restaura la URL previa del visor (`sessionStorage`).

- **Información por clic** (`CatalogoInfoBox`): clic sobre la capa activa consulta `GetFeatureInfo` de GeoServer y renderiza una tarjeta con `renderCard` del visor, usando `littleCard` (config heredada de `mapalab.layers`).
- **Botón de información**: vive en la barra de atribuciones (a la derecha de "Contribuciones") vía `extraRight`; en el primer ingreso su tooltip se auto-despliega (`useFeatureSeen`).
- **Compartir** (`CatalogoShare`): botón junto a "Descargar" que despliega dos pills en naranja institucional, `Enlace` (copia con feedback verde 2.5 s, fallback `window.prompt`) y `QR` (código con el logo corto de Mapalab al centro y descarga PNG a 800 px). El mismo componente se reusa para compartir la institución desde el header. `qr-code-styling` se carga con `import()` dinámico y usa `errorCorrectionLevel: 'H'` para tolerar el logo. El logo se pide **por ruta relativa** (`/acervo/iieg/logos/mapalab_short.svg`) y se convierte a data URL para no *taintear* el canvas: con URL absoluta el `connect-src` del CSP bloquea el fetch. Donde esa ruta no resuelve, cae al SVG del bundle sin romper la generación.
- **Instituciones**: pills entre la lista y el input, con "Todas" activa por defecto (morada; las instituciones en naranja). Al elegir una, la lista se filtra, la URL pasa a `/catalogo/<institucion>` y el header cambia de "Catálogo" al nombre de la institución seguido de `catálogo` en chico y gris. Junto a la X aparece el botón de compartir de la institución.
- **Lista desplegable** (`CatalogoInstitucionesList`): el botón a la derecha de las pills abre, **debajo de ellas**, una lista vertical con logo, nombre y número de capas por institución — pensada para cuando haya demasiadas para la fila de pills. La entrada "Todas" usa el logo corto de Mapalab; una institución sin `logo_url` muestra su inicial.
- **Búsqueda por institución**: el buscador de capas también matchea el nombre y el slug de la institución, así que escribir «SADER» lista sus capas sin cambiar de filtro.
- **Barra temporal** (`CatalogoTimeBar`, centrada arriba): sólo aparece si la capa tiene periodicidad. Colapsada es una pill con `[play/pausa] fecha [bote de basura]`; expandida agrega una `×` a la derecha del bote para cerrar el panel, y monta `PeriodicitySection` del visor **sin modificar** (sin modo avanzado). El bote de basura (rojo `#FF577D`) quita el filtro de fecha y detiene el loop; la `×` sólo cierra. Pasa `loopAppliesToSlot` para que el mes o año en curso se resalte con el panel abierto — sin esa bandera, `getSpecificFilterOverride` apaga el resaltado del loop en `SimpleDateSelector`.
- **Fecha topada a tres meses**: con más de tres meses seleccionados la pill se resume en rango («Enero a Mayo de 2024») si son contiguos, o en conteo («4 meses de 2024») si no lo son. `formatDateFilterPill` (`dateLoopHelpers.js`) envuelve a `formatLoopLabelLong` con `maxMonths: 3`; el helper original conserva su comportamiento para el resto de sus consumidores. El motor es `useDateLoop`, también sin cambios — por eso la vista se envuelve en `LayerLoadingProvider`. El cableado vive en `useCatalogoTiempo` (periodicidad por workspace+capa, filtro de una sola capa, `updateParams` al WMS) y `useCatalogoLoop` (config del ciclo y `canPlay`). El stub de `MapsContext` suma `getSpecificFilter`, `getLoopState` y `stopLoop`, que es lo único que `SimpleDateSelector` toma del contexto.
- **Default por geometría**: polígonos arrancan en el año más reciente; puntos y líneas sin filtro; raster en la fecha más reciente disponible. `fetchGeometryType` (cacheado) resuelve la geometría y `RASTER_WORKSPACES` el caso raster.
- **Raster (TIME)**: las capas raster no están en `public.layer_periodicity`; su periodicidad se lee de la **dimensión TIME del GetCapabilities** (`getLayerTimePeriodicity`, mismo request que el bbox). El filtro se aplica como parámetro `TIME` del WMS, no como `CQL_FILTER`.
- **Fecha en descarga y URL**: `downloadCatalogoCapa` recibe el `cqlFilter` activo — CSV lo traduce a `date_from`/`date_to` con `cqlToDateRange`, GPKG/SHP lo mandan como `CQL_FILTER` a WFS. La fecha vectorial se serializa en la URL compartida como `?fecha=` (`cqlToFechaParam`/`fechaParamToCql`) y se restaura al abrir el enlace. El estado del tiempo vive en `CatalogoTiempoProvider` para que mapa, leyendas y página compartan el mismo filtro.
- **Leyenda por fecha**: el panel usa `buildLegendGraphicUrl` (compartido con el visor) con `hideEmptyRules`, así la leyenda oculta las clases sin datos en la fecha filtrada. Re-renderiza al cambiar la fecha.

## Entradas desde el visor

Dos botones ("Catálogo"): flotante junto a Contribuciones y en el sider bajo el selector de modo. **Gateados** a `VITE_APP_ENV ∈ {dev,beta}` (`IS_NON_PROD`) → ocultos en producción; la ruta `/catalogo` funciona por URL directa.

## Alta de capas (mariachi admin)

Subpágina "Catálogo" (grupo Mapalab) con dos **pestañas**: «Capas» e «Instituciones», cada una con su conteo. El estado y las llamadas al API viven en `useCatalogoData`; la vista de capas en `CapasTab`.

La pestaña **Instituciones** permite alta (slug autocompletado desde el nombre hasta que se edite a mano), edición inline de nombre y slug, logo opcional vía `BucketFilePicker`, borrado y reorden por drag & drop.

La pestaña **Capas** tiene una botonera con tres acciones que despliegan un **panel inline** (no modal) debajo:

- **Agregar capa** (`CapaFormPanel`): form guiado por GeoServer (elige workspace → capa; `nombre`/`slug` se autocompletan del título/nombre y son opcionales; etiquetas con autocompletado; institución opcional). También se abre con **doble clic** en una fila para editar.
- **Importar workspace** (`ImportWorkspacePanel`): importa de golpe todas las capas nuevas de un workspace (lee **WMS GetCapabilities** para nombres+títulos), con institución opcional para todo el lote.
- **Agregar múltiples capas** (`BulkAddPanel`): `Transfer` de dos paneles para mover capas dentro/fuera del catálogo.
La tabla de capas muestra Nombre (con el workspace debajo), Institución, Etiquetas (con filtro por lista) y Acciones. **Editar una capa se hace desplegando su fila** (`CapaDetalleEditor`): ahí viven nombre, slug, workspace, capa de GeoServer, institución, etiquetas y habilitada, con Guardar/Descartar, más los datos de solo lectura (URL pública, última edición, orden). Arriba hay un **buscador general** que cubre todos esos campos —incluidos los que no son columna— y un `Segmented` de Todas / Habilitadas / Deshabilitadas.

La **selección múltiple** habilita la barra de acciones (`SelectionActionsBar`): asignar institución, habilitar/deshabilitar, etiquetar (sumando o reemplazando) y eliminar — todo vía `POST /catalogo/bulk-update`, que con `exclude_unset` solo toca los campos enviados. El alta valida contra GeoServer.

**Reordenar** (mariachi 1.74.0 + mapalab 1.85.4): el botón "Reordenar" cambia la tabla a una lista plana con drag & drop (`@dnd-kit`, componente compartido `SortableTableRow`); al soltar hace `PUT /api/mariachi/catalogo/reorder` `{ ids }` y persiste `orden` en `mapalab.catalogo_capas`. Las capas nuevas quedan al final (`orden = MAX(orden) + 1`). Tanto el admin como la vista pública `/catalogo` (`CatalogoRepository.get_enabled_capas`, `ORDER BY orden, nombre` desde mapalab 1.85.4) respetan ese orden. Requiere la migración `0027_catalogo_capas_orden` (columna `orden`) en dataengine.

## Telemetría

Además de los 10 eventos del embudo original, la vista emite `catalogo_share` (`scope` = `capa`/`institucion`, `slug`, `type` = `link`/`qr`/`qr_download`) y `catalogo_institucion_select` (`slug`, `capas`). Inventario completo en `docs/analytics.md`.

## Despliegue

Aplicar las migraciones **antes** de los backends (sin las tablas o columnas, los endpoints dan 500). Ver `RUNBOOK.md` → "Catálogo de capas (Mapalab)".
