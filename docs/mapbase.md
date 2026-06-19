# Mapas base y overlays permanentes

Documentación del sistema de mapas base del visor (capas de fondo seleccionables) y de los **overlays permanentes** que viven junto a ellos (etiquetas, sombreado de relieve). Cubre el estado actual hardcodeado y lo que queda pendiente para administrarlo desde mariachi.

## Conceptos

El visor de OpenLayers tiene tres tipos de capa de fondo, todas **fuera** del WMS layer manager y **fuera** del panel de capas activas:

| Capa | zIndex | Permanencia | Origen |
|---|---|---|---|
| Mapa base (Carto/OSM) | `-1` | Seleccionable por el usuario (incluye "Sin Mapa Base") | CartoCDN (XYZ) |
| Overlay de etiquetas | `9000` | Permanente, atado al mapa base y al zoom | CartoCDN (XYZ) |
| Overlay de relieve (sombreado) | `10000` | Permanente, visible salvo "Sin Mapa Base" | GeoServer (TileWMS) |

Ninguna de estas pasa por `activeLayerIds`, por eso no aparecen en el panel de capas activas ni se serializan como capas en la URL/share.

## Mapas base seleccionables

### Definiciones

`frontend/src/pages/maps/helpers/basemaps.js`

```js
export const BASEMAPS = {
  voyager:     { id: 'carto_voyager', label: 'Mapa Carto Voyager', labelZoomThreshold: 15, create, createLabelsOverlay },
  position:    { id: 'carto_light',   label: 'Carto Light',        labelZoomThreshold: 15, create, createLabelsOverlay },
  sin_mapalab: { id: 'sin_mapalab',   label: 'Sin Mapa Base',      create: () => null },
};
export const BASEMAP_ORDER = ['voyager', 'position', 'sin_mapalab'];
```

- Cada basemap expone `create()` (fuente del fondo, sin etiquetas) y, opcionalmente, `createLabelsOverlay()` (fuente solo-etiquetas).
- Los tiles vienen de `https://basemaps.cartocdn.com/{path}/{z}/{x}/{y}{r}.png` vía `ol/source/XYZ` con subdominios `a-d` y `crossOrigin: 'anonymous'`.
- `sin_mapalab` retorna `null` en `create()`: es el modo "Sin Mapa Base".

### Estado

`frontend/src/providers/MapsProvider.jsx`

- `baseMapId` arranca en `'voyager'`. Se expone como `baseMapId` / `setBaseMapId` en `MapsContext`.
- No se persiste en `localStorage`; sí viaja en el share/embed según el contexto (serializadores).

### Inicialización del mapa

`frontend/src/pages/maps/hooks/useMapInitialization.js`

Crea el `ol/Map` con el stack de capas de fondo fijo:

```js
const initialLayers = [
  new TileLayer({ source: initialConfig.create(),        zIndex: -1 }),          // mapa base
  new TileLayer({ source: labelsOverlaySource,           zIndex: 9000, visible: false }), // etiquetas
  reliefLayer,                                                                    // relieve (zIndex 10000)
];
```

- Proyección del mapa: `EPSG:3857` (Web Mercator). `maxZoom: 18`, `minZoom` 7/8 según viewport (`getMinZoom`).
- Vista inicial: si la URL trae `?layers` + `lat`/`lon`/`zoom` los usa; si no, el default de `helpers/defaultView.js` (centrado en Jalisco).
- Las refs (`baseMapRef`, `labelsOverlayRef`, `reliefOverlayRef`) se asignan a `map.getLayers().item(0|1|2)` y se limpian en el cleanup.

### Gestión reactiva

`frontend/src/pages/maps/hooks/useBaseMapManager.js`

- **Effect 1**: al cambiar `baseMapId`, intercambia el `source` del fondo y del overlay de etiquetas. Si `create()` retorna `null` (Sin Mapa Base), oculta ambas capas.
- **Effect 2**: listener `moveend` que muestra/oculta las etiquetas según `zoom >= labelZoomThreshold`.

### UI de selección

`frontend/src/pages/maps/components/BaseMapList.jsx`

Grid de 2 columnas, un botón por `BASEMAP_ORDER`. El ícono se resuelve por `id` desde `Icon.jsx`. Al seleccionar: `setBaseMapId(id)` + `trackBasemapChange(id)` (analytics + telemetría propia).

### Atribución

`frontend/src/pages/maps/components/MapAttribution.jsx`

Píldora "Contribuciones ©" abajo a la derecha. Se **oculta** cuando `baseMapId === 'sin_mapalab'`.

## Overlay de relieve (sombreado)

Capa permanente de sombreado de relieve que se pinta **siempre por encima de cualquier capa o mapa base**, sin aparecer en el panel de capas activas. El estilo/blend lo resuelve GeoServer; el visor solo la posiciona arriba y elige la variante.

### Comportamiento

- **Visible** siempre que haya mapa base. Se oculta solo en "Sin Mapa Base" (`baseMapId === 'sin_mapalab'`).
- **Siempre arriba**: `zIndex: 10000`, por encima de etiquetas/capas pineadas (`9000`), dibujo (`1000`) y temáticas (`100-999`).
- **Variante IIEG/INEGI**: usa dos capas distintas de GeoServer según el estado del switch IIEG/INEGI del panel de capas activas.

### El switch IIEG/INEGI es derivado

No existe un estado global `base = 'iieg' | 'inegi'`. El "modo INEGI" se **infiere** de qué capas de límites están activas:

`frontend/src/pages/maps/helpers/basemaps.js`

```js
export const INEGI_LIMIT_LAYER_IDS = ['limite_inegi', 'limite_municipal_inegi'];
export const isInegiBaseMode = (activeLayerIds = []) =>
  activeLayerIds.some(id => INEGI_LIMIT_LAYER_IDS.includes(id));
```

Este helper es la fuente única de verdad: lo consume tanto `ActiveLayersList` (para pintar el switch) como `MapView` (para elegir la variante del relieve). Sin capas de límites activas → `false` → variante IIEG por defecto.

### Definiciones

`frontend/src/pages/maps/helpers/basemaps.js`

```js
const RELIEF_WORKSPACE = 'raster';
const RELIEF_LAYERS = {
  iieg:  'sombreado_relieve_iieg',
  inegi: 'sombreado_relieve_inegi',
};
export const RELIEF_OVERLAY_Z_INDEX = 10000;
export const RELIEF_OVERLAY = {
  iieg:  () => createReliefSource(RELIEF_LAYERS.iieg),
  inegi: () => createReliefSource(RELIEF_LAYERS.inegi),
};
```

`createReliefSource` arma un `ol/source/TileWMS` contra `${VITE_GEOSERVER_URL}/raster/wms` con `serverType: 'geoserver'`, `FORMAT image/png`, `TRANSPARENT true`, `VERSION 1.1.0` y `TILED true`. La reproyección a `EPSG:3857` la resuelve GeoServer.

### Montaje y control

- `useMapInitialization` monta el `TileLayer` del relieve como tercer elemento del stack (`zIndex: 10000`), con `visible = baseMapId !== 'sin_mapalab'` y marca `reliefVariant = 'iieg'`.
- `frontend/src/pages/maps/hooks/useReliefOverlay.js` reconcilia en cada cambio de `baseMapId` / `isInegiMode`:
  - `setVisible(baseMapId !== 'sin_mapalab')`.
  - Cambia el `source` solo cuando la variante deseada difiere de `reliefVariant` (evita re-fetch al alternar entre dos mapas base reales).
- `MapView` deriva `isInegiMode` del `activeLayerIds` del pane (con `isInegiBaseMode`), por lo que en modo swipe cada panel A/B respeta su propia variante.

### Por qué no entra al WMS layer manager

El relieve es un fondo permanente, no una capa de datos togglable. Montarlo en `useWMSLayerManager` lo metería en `activeLayerIds` → aparecería en el panel de capas activas, en la URL y en el reordenamiento. Por eso replica el patrón del overlay de etiquetas: capa fija en el stack de OpenLayers gestionada por su propio hook.

## Pendientes

### 1. Nombres reales de las capas de GeoServer

Las capas `raster:sombreado_relieve_iieg` / `raster:sombreado_relieve_inegi` son **placeholder**. Cuando los analistas espaciales publiquen las capas definitivas, basta ajustar `RELIEF_WORKSPACE` y `RELIEF_LAYERS` en `helpers/basemaps.js` (un solo punto). Si la separación IIEG/INEGI no resulta en dos capas sino en dos `STYLES` sobre la misma capa, se resuelve en el factory `createReliefSource` sin tocar el resto.

### 2. Fase 2 — Administración de mapas base y overlays desde mariachi

Hoy todo lo de este documento está **hardcodeado** en el frontend. Es lo último que sigue así después de la migración de capas a CMS (v1.4.0, capas editadas desde mariachi y leídas vía `/layers/tree`). La evolución natural es una sección de administración análoga.

Alcance estimado (épica propia, no parte de la prueba del relieve):

- **Modelo de datos** (DataEngine, schema `mapalab`): tabla de mapas base / overlays con tipo de fuente (`xyz` / `wms` / `wmts`), URL/params, atribuciones, orden, ícono, `labelZoomThreshold`, flags de overlay permanente, `zIndex` y reglas de visibilidad (ej. el binding al switch IIEG/INEGI).
- **Backend mapalab**: endpoint `/basemaps` con cache materializada (mismo patrón que `/layers/tree`) y validación de URLs venidas del admin.
- **Frontend mapalab**: `basemaps.js` deja de ser estático; `BASEMAPS`/`BASEMAP_ORDER` y los overlays se cargan desde el backend. Un factory por tipo de fuente reconstruye las funciones `create()`. `useBaseMapManager`, `useMapInitialization` y `useReliefOverlay` ya son data-driven, así que el refactor es acotado.
- **Mariachi (admin)**: nueva sección "Mapas base / Overlays" con CRUD, preview, picker de íconos (reusa `BucketFilePicker`) y reordenamiento drag & drop (reusa el del árbol de capas).
- **Íconos**: migrar los íconos de basemap de `Icon.jsx` (hoy resueltos por `id`) al bucket del Acervo (alineado con el plan de centralización de íconos).

Fricciones a considerar (lo que no se serializa trivialmente):

- Las funciones `create()` son código OpenLayers (XYZ con subdominios, TileWMS con params, overlay de etiquetas). Hay que definir un **catálogo cerrado de tipos de fuente** + factory, no URL libre.
- El binding condicional del relieve al switch IIEG/INEGI es lógica, no datos: modelar "overlay permanente cuya fuente cambia según el estado del switch" de forma genérica es la parte más compleja.

Recomendación: dejar el relieve hardcodeado para esta prueba (desbloquea a los analistas, cero dependencia de mariachi) y planear la fase 2 como versión propia.

## Referencias

| Archivo | Rol |
|---|---|
| `frontend/src/pages/maps/helpers/basemaps.js` | Definiciones de mapas base, relieve y helper `isInegiBaseMode` |
| `frontend/src/pages/maps/helpers/defaultView.js` | Vista y zoom iniciales por viewport |
| `frontend/src/pages/maps/hooks/useMapInitialization.js` | Monta el stack de capas de fondo (base + etiquetas + relieve) |
| `frontend/src/pages/maps/hooks/useBaseMapManager.js` | Intercambio de mapa base y visibilidad de etiquetas por zoom |
| `frontend/src/pages/maps/hooks/useReliefOverlay.js` | Visibilidad y variante IIEG/INEGI del overlay de relieve |
| `frontend/src/pages/maps/components/MapView.jsx` | Cablea los hooks; deriva `isInegiMode` por pane |
| `frontend/src/pages/maps/components/BaseMapList.jsx` | UI de selección de mapa base |
| `frontend/src/pages/maps/components/MapAttribution.jsx` | Atribución (oculta en "Sin Mapa Base") |
| `docs/z-index.md` | Jerarquía completa de z-index (UI y capas del mapa) |
