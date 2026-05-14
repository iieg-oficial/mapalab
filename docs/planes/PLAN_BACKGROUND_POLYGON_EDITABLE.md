# Plan — Configurar capas de fondo (background polygons) desde mariachi

## Contexto

La feature de "pinear capas de límite arriba cuando hay otro polígono activo" (`useAlwaysOnTopPinning`) usa un Set hardcoded de capas que se consideran "fondo" (polígonos que **no** deben disparar el pin porque visualmente no tapan etiquetas):

```js
// frontend/src/pages/maps/hooks/useAlwaysOnTopPinning.js
const BACKGROUND_POLYGON_LAYER_NAMES = new Set([
    'general:cuerpos_de_agua_50k',
    'economia:cultivos',
    'recursos:areas_naturales_protegidas'
]);
```

Cada vez que se agrega una capa nueva al sistema que sea polígono de contexto, hay que editar este archivo y redeployar el frontend. No escala.

## Problema

- El catálogo de capas vive en `mapalab.layers` (DataEngine) y se edita desde mariachi.
- El editor de capas en mariachi no expone ningún flag de "es fondo visual" / "no disparar pin".
- Quien decide qué es fondo es el equipo de contenido, no el frontend developer.

## Objetivo

Mover el control de `BACKGROUND_POLYGON_LAYER_NAMES` a la BD, editable desde mariachi.

## Diseño propuesto

### Backend / BD

1. Agregar columna `es_fondo_visual BOOLEAN DEFAULT FALSE NOT NULL` en `mapalab.layers` (migración alembic en `dataengine`).
2. Reflejar en el endpoint `/layers/tree` del backend mapalab — el nodo leaf incluye `esFondoVisual: true|false`.
3. Reflejar en `wmsConfig` hidratado (`frontend/src/pages/maps/helpers/wmsConfig.js`) para que el frontend lo consuma sin lookups extra.

### Mariachi (editor)

1. En el form de edición de capa (`/administrador/mapalab/layers/<id>`), agregar checkbox **"Capa de fondo visual"** con tooltip explicativo:
   > Si está activada, esta capa no dispara el pin de límites arriba aunque sea polígono. Útil para capas de contexto (cuerpos de agua, áreas protegidas, etc.) cuyo estilo no compite con las etiquetas.
2. Validación: solo permitir activar para capas con `node_type='leaf'` cuyo WMS resuelva a polígono. (Opcional: deshabilitar el checkbox si no es polígono, hint visual.)
3. Al guardar, invalidar caché del layer-tree (`POST /mapalab/api/layers/invalidate-cache`).

### Frontend (mapalab)

1. Eliminar `BACKGROUND_POLYGON_LAYER_NAMES` hardcoded de `useAlwaysOnTopPinning.js`.
2. La función `isBackgroundPolygon(id)` consulta `findLayerDef(id).esFondoVisual` en lugar del Set local.
3. Mantener fallback: si el flag no existe en el nodo (capas antiguas no migradas), defaultear a `false` (no es fondo).

### Migración de datos

Llenar `es_fondo_visual = TRUE` para las 3 capas actuales:

- `general:cuerpos_de_agua_50k`
- `economia:cultivos` (afecta los 8 hijos del grupo `Clasificador de cultivos IIEG`)
- `recursos:areas_naturales_protegidas` (capa `anp_jalisco`)

Hacerlo como parte de la migración (UPDATE inicial) para no perder el estado actual al deployar.

## Archivos afectados (cuando se ejecute)

### `dataengine`
- `migrations/versions/XXX_add_es_fondo_visual.py` — migración alembic
- `jobs/bootstrap/v14_schema.sql` — agregar columna al schema base
- Seed/update inicial para las 3 capas actuales

### `mapalab` (backend)
- `backend/app/models/...` — agregar campo al modelo SQLAlchemy de layers
- `backend/app/services/layer_tree_service.py` — incluir `es_fondo_visual` en el JSON del tree
- `backend/app/routers/layers.py` — no requiere cambio si el tree-cache ya incluye todos los campos

### `mariachi`
- Form de capa (admin): checkbox + label + tooltip
- Validación + persistencia

### `mapalab` (frontend)
- `frontend/src/pages/maps/helpers/wmsConfig.js` — `hydrateWmsConfig` incluye `esFondoVisual`
- `frontend/src/pages/maps/hooks/useAlwaysOnTopPinning.js` — elimina constante hardcoded, consulta el flag de la capa
- Test correspondiente en `frontend/src/test/` si aplica

## No-objetivos

- No migrar la decisión de "qué capa cuenta como polígono" — eso sigue siendo automático vía `fetchGeometryType` (WFS `DescribeFeatureType`).
- No exponer un flag general "no disparar pin" para puntos/líneas — `fetchGeometryType` ya los excluye correctamente; el problema es solo con polígonos de fondo.
- No tocar la lista `ALWAYS_ON_TOP_LAYER_IDS` (límites IIEG / INEGI) — esa sí permanece hardcoded porque son capas semánticamente especiales.

## Estado

📋 **Pendiente** — implementar cuando se priorice. Hoy se mantiene la lista hardcoded en `useAlwaysOnTopPinning.js`.
