# Swipe — Comparador A|B

Documenta el comparador *swipe*: dos configuraciones de capas independientes lado a lado, separadas por una barra divisora arrastrable (vertical u horizontal).

Reemplaza al antiguo `compare-split` y al `CompareDateModal`. La configuración de cada lado se hace desde el sider con la pildora A|B, no con un modal.

## Modelo

Estado central en `useSwipeMode`:

```js
compareMode = {
    active: boolean,
    activeSlot: 'A' | 'B',
    paneA: { activeLayerIds, hiddenLayerIds, layerOpacities, filters, label },
    paneB: { activeLayerIds, hiddenLayerIds, layerOpacities, filters, label },
    originalSnapshot: { ... } | null,
    swipePosition: number,           // 0.05 .. 0.95 (clampado)
    swipeOrientation: 'vertical' | 'horizontal',
    globalOrder: string[],           // IDs en el orden global de la unión paneA + paneB
}
```

Cada pane es un **snapshot completo** de capas, opacidades, visibilidad y filtros. El estado global de capas (`activeLayerIds`, `hiddenLayerIds`, `layerOpacities`, `filters`) **espeja al `activeSlot`**: toda mutación que el usuario hace desde el sider, panel de capas o filtros se aplica al slot activo, y al cambiar de slot se hace swap entre el global y el pane que estaba congelado. Por eso al hablar de "live state" en swipe nos referimos al snapshot del slot activo.

### `globalOrder`

Array de IDs que dicta el orden de la unión `paneA + paneB` en `effectiveActiveLayerIds`. `setLayerSlotMembership` lo extiende, `removeLayerFromSlot` lo limpia, `reorderInSlots` lo reescribe. Sin este array, la unión siempre concatenaba paneA primero y el reorden cross-slot se "regresaba".

### `originalSnapshot`

Al entrar a swipe se snapshotea el live state actual + se persiste en `localStorage` (`mapalab.swipe.original_snapshot`) para sobrevivir recargas. Al salir, se restaura. Permite que la UX sea no-destructiva.

### Compartido entre A y B

- `view` (centro, zoom, rotación) — **misma instancia de `View`** entre los dos `OLMap` (`useViewSync`)
- `baseMapId`
- `selectedLayerForSymbology`

## Arquitectura de render

```
Maps.jsx
└── isComparing
    ├── true  → <SwipeView />  (dos <MapView paneIndex={0|1}> apilados)
    └── false → <MapView />    (un solo mapa)
```

`SwipeView.jsx` monta:

```jsx
<div data-swipe-composite="true">
    <MapView paneIndex={0} />                                    {/* paneA siempre visible */}
    <div style={{ clipPath: inset(...) }}>
        <MapView paneIndex={1} />                                {/* paneB clipeado */}
    </div>
    <Handle />                                                   {/* barra naranja draggable */}
    <OverlayA /> <OverlayB />                                    {/* solo cuando highlightedSlots */}
</div>
```

- El recorte es **CSS clip-path** (no hay overhead de OL ni redibujo de tiles).
- Pointer events: el clip-path nativo descarta clicks fuera del área visible → cada click llega al pane correcto.
- La barra naranja es un `<div role="separator">` con listeners propios, no un `ol.control`.

### Implementación propia (no `ol-ext`)

No usamos `ol.control.Swipe` de `ol-ext`. La razón: ol-ext clipa **layers** dentro de un solo mapa con `prerender`/`postrender` events. Eso obliga a ambos lados a compartir layers, lo que rompe el modelo paneA/paneB con filtros y fechas independientes. Nuestra implementación tiene **dos `OLMap` completos**, cada uno con sus propias capas, listeners y feature info.

Costo: dos `GetMap` por cada cambio de view (uno por pane). Beneficio: A y B son configurables totalmente independientes.

## Sincronización de View

`useViewSync` comparte la **misma instancia de `ol.View`** entre los dos mapas:

```js
m1.setView(m0.getView());
```

OL renderiza ambos mapas con la misma vista. Una sola animación de zoom emite un solo flujo de `change:resolution`/`change:center` y cada mapa hace **una** request final. Antes (con sync por eventos `setCenter`/`setZoom` directo en el segundo View), una animación `view.animate({ duration: 250 })` en pane A propagaba múltiples valores intermedios a pane B → varias `GetMap` extra en el lado B durante cada zoom.

Cleanup conservador: si el segundo mapa sigue montado al desactivar swipe, restaura su View original. En el caso normal (salir de swipe → panes se desmontan) no hace nada — los maps se destruyen y el View compartido se libera.

## `paneMapRefs` y `paneMapInstances`

- `paneMapRefs` — registry `{ 0: refPaneA, 1: refPaneB }` (ref). Cada `<MapView paneIndex={i}>` lo puebla en mount. Es **no reactivo** y se usa donde se necesita acceso síncrono al ref (e.g. `useMapCapture`, `useMapMarker`).
- `paneMapInstances` — state `{ 0: mapInstance, 1: mapInstance }` en `MapsProvider`. `<MapView>` llama `setPaneMapInstance(paneIndex, instance)` cuando `useMapInitialization` retorna el map; null en cleanup. Es **reactivo**: consumers como `useViewSync` y `ScaleLineControl` reaccionan al cambio sin polling.

Consumers en swipe (`MapControls`, `useMapView.getActiveMapRef`, `useMapMarker`) siguen usando `paneMapRefs[0]?.current` por compatibilidad. `<SwipeView>` y `<ScaleLineControl>` usan `paneMapInstances[0]` (state).

Crítico: **`mapRef.current` (live) es `null` en swipe** porque el `<MapView />` live no se monta. Cualquier consumer que lea `mapRef.current` directo necesita un fallback. Ver tabla de consumers más abajo.

## Pildora A|B (`<SlotBadge>`)

Cicla membership por capa: `A → AB → B → A`. Implementado por `setLayerSlotMembership(layerId, target)` en `useSwipeMode`. Cada toggle actualiza `paneA.activeLayerIds` y/o `paneB.activeLayerIds`, copia opacities/filters del pane fuente, y extiende `globalOrder` si la capa entra por primera vez.

`useSymbology.stillActive` valida contra `paneA + paneB` (no solo el live state) para que el item no se deseleccione al pasar AB → B.

**Botón Eliminar en swipe** quita la capa de **ambos** slots — para mover entre slots se usa la pildora.

### Posición del `<SlotBadge>` en el item del panel de capas activas

Depende de si la capa tiene fecha activa en algún slot:

| Estado | `<LayerDateControls>` (fila 2) | `<SlotBadge>` |
|---|---|---|
| Capa con fecha (live, paneA o paneB) | Se renderiza con pildora de fecha + loop controls | En la fila 2, junto a las pildoras de fecha |
| Capa sin fecha en ningún slot | Retorna `null` (la fila 2 desaparece) | A la derecha del `<LayerTitle>` (fila 1) |

`<ActiveLayerItem>` deriva `hasAnyDateLabel` corriendo `computeLabel` sobre `dateFilter` live, `compareMode.paneA.filters[layer.id]?.date` y `compareMode.paneB.filters[layer.id]?.date`. Cuando `compareMode.active && slotMembership && !hasAnyDateLabel`, monta el `<SlotBadge>` en la fila 1 después del título.

El `<Switch>` A/B de la fila 3 (`<LayerActionsBar>`) sigue mostrándose sólo cuando `slotMembership === 'AB'` y cambia el `activeSlot` global; es independiente del SlotBadge (que cicla *membership* de la capa, no *active slot*).

## Entrada y salida del swipe

- **Entrada**: `enterCompareMode()` en `useSwipeMode` (alias histórico `enterSwipeMode` removido en favor de simetría con `exitCompareMode`). Snapshotea live → `originalSnapshot` y `localStorage` (con límite de tamaño `SNAPSHOT_MAX_BYTES`). Pausa todos los loops temporales. Vacía live state. `compareMode.active = true`, `activeSlot = 'A'`. Disparado desde el botón "Comparar" en `MapToolsPanel`.
- **Salida**: `exitCompareMode()`. Restaura `originalSnapshot` (o lo lee de `localStorage` si no estaba en memoria). Limpia el storage. `<CloseButton>` rosa centrado en `<SwipeSlotControls>`, con confirmación.

## Persistencia

### Share envelope

```json
{
    "version": 1,
    "kind": "swipe",
    "payload": {
        "shared": { "view", "basemap", "selected" },
        "paneA": { "label", "layers": [...] },
        "paneB": { "label", "layers": [...] },
        "activeSlot": "A" | "B",
        "position": 0.5,
        "annotations": [...]
    }
}
```

`useShareSerializer.js:118-149` y `useShareDeserializer.js:56,107` lo manejan. El slot activo se serializa con el live state; el slot opuesto, con su snapshot del `compareMode`. Solo `kind: 'single' | 'swipe'`, sin fallback legacy.

**`annotations`** (opcional, desde mapalab 1.43.0): array de mediciones/anotaciones convertidas a GeoJSON `EPSG:4326`. Las anotaciones son globales del mapa (no por slot — la decisión documentada en §Pendientes), así que el campo vive a nivel de `payload`, no dentro de `paneA`/`paneB`. Ver §Annotations.

### sessionStorage

`useSessionPersistence` serializa `kind: 'swipe'` con `position` para sobrevivir recargas dentro de la sesión. Si se entra con `?compare=swipe` sin sessionStorage, cae a modo single.

### `originalSnapshot`

Independiente del share. Solo vive durante la sesión de swipe (en `localStorage` clave `mapalab.swipe.original_snapshot`). Permite restaurar al salir.

## Herramientas habilitadas en swipe

| Herramienta | Estado | Notas |
|---|---|---|
| Click → InfoBox | ✅ | Cada `<MapView>` tiene su listener; el feature info se consulta con los layers del pane que recibió el click. Click en pane no-activo dispara `setActiveSlot` para sincronizar la UI |
| Zoom +/− y "Centrar en Jalisco" | ✅ | `MapControls.getActiveMap()` resuelve a paneA en swipe; el shared View propaga al pane B |
| "Mi ubicación" | ✅ | El feature de geolocalización se agrega a **ambos** paneles en swipe (visible en cualquier orientación del clip) |
| Compartir | ✅ | Envelope `kind: 'swipe'` con ambos snapshots |
| Descarga del mapa (PNG/PDF) | ✅ | `useMapCapture.captureSwipeComposite` captura los dos canvases por separado y los compone con `composeSwipeCanvas` (respeta orientación y posición) |
| Leyenda | ✅ | Inline en cada item del panel de capas activas. Usa el filtro de fecha del `activeSlot` |
| Filtros CQL y fechas | ✅ | Cada slot mantiene los suyos; aplican solo al slot activo |
| Marker IIEG (logo en sider) | ✅ | `useMapMarker.getActiveMap()` resuelve a paneA. El View compartido anima a ambos paneles |

## Annotations (mediciones persistidas en el share)

Desde mapalab 1.43.0, el botón "Compartir" muestra un checkbox **"Incluir mis mediciones y anotaciones"** cuando el `vectorSource` del `useMapDrawing` tiene features. Marcado, el serializer convierte cada `measurement.feature.getGeometry()` a GeoJSON con `featureProjection:'EPSG:3857' → dataProjection:'EPSG:4326'` y agrega `payload.annotations: [{id, type, geometry, label?, value?, textLabel?, rotation?, visible}]`.

Al cargar un share con `annotations`, `useShareDeserializer` invoca `restoreAnnotations(annotations)` (expuesto por `useMapDrawing` vía `MapsProvider`). El método:

1. Llama `ensureVectorLayer()` con retry-polling (max 5 s) — los shares se aplican antes de que el mapa termine de montar en muchos casos.
2. Por cada item: `RESTORE_GEOJSON.readFeature` reconstruye el `ol.Feature`. Para `LineString`/`Polygon` reconstruye `formatLength`/`formatArea` desde la geometría (no confía en `value` recibido). Para `Text`/`Emoji` set `textLabel` + `rotation` + `annotationType`. Para `Freehand`, set `annotationType='Freehand'`.
3. `source.addFeature(feature)` lo mete al vectorSource y `setMeasurements(prev => [...prev, ...restored])`.

**Las anotaciones se restauran tanto en single como en swipe** — son globales del mapa, no por pane, alineado con la decisión documentada abajo en §Pendientes.

## Pendientes (no habilitados en swipe)

| Herramienta | Razón | Para retomar |
|---|---|---|
| Dibujar mediciones nuevas en swipe | `useMapDrawing.startDrawing` opera sobre `mapRef` global (null en swipe). Decisión arquitectónica: una capa vector compartida entre paneles (recomendado, alinea con la persistencia global en shares), o una por slot. La medición es geográfica → globales tiene más sentido. *Pre-existentes vía share ya se ven*. |
| ZenMode | No prioritario; mayoritariamente CSS para condicionar render de overlays del swipe |
| Loop temporal | `useDateLoop` se cancela al entrar a swipe. Tres opciones: por slot activo (simple), sincronizado con offset fijo entre A y B (recomendado, da valor diferencial), o independiente por slot |

## Consumers de `mapRef` / `View` en swipe — referencia rápida

| Consumer | Comportamiento en swipe |
|---|---|
| `MapControls` | usa `getActiveMap()` → paneA |
| `ScaleLineControl` | usa `paneMapInstances[0]` (state reactivo) |
| `useViewSync` | usa `paneMapInstances[0,1]` (state reactivo, sin polling) |
| `useMapMarker` | `getActiveMap()` → paneA. `openMarkerCard` acepta un `mapInstance` opcional para usar el map exacto del click |
| `useMapView.getActiveMapRef` | retorna paneA |
| `useMapCapture.getMapSnapshot` | usa anchor (paneA), opera `view.setCenter/setResolution` que afecta a ambos panes vía View compartido |
| `useFeatureInfo` | acepta `overrides` con `{ activeLayerIds, hiddenLayerIds, getFilter }`. `<MapView>` en swipe le pasa los del paneSnapshot |
| `useShareSerializer` / `useShareDeserializer` | usan `mapRef.current` (live, `null` en swipe) — limitación conocida; el View se serializa desde el slot activo si está disponible |
| `useMapMarker` listener click | registrado en cada `<MapView>` (no en el hook) → cada pane responde a sus propios clicks de marker |

## Estilo visual

- Color asociado: A = morado IIEG (`#5C2472`), B = naranja (`#FF8300`, mismo del handle del swipe)
- Handle naranja con knob blanco (`<svg>` con flechas según orientación)
- Overlays "A"/"B" gigantes en `font-garet bold text-[120px]` cuando `highlightedSlots` está activo (al cambiar de slot por la pildora)
- `<SwipeSlotControls>`: barra inferior centrada `[A · orientación · B]` con `<DatePill autoWidth>`. `<CloseButton>` rosa arriba si hay periodicidad seleccionada o dentro de la barra si no la hay
- Tooltips dinámicos: anexan `del lado A`/`del lado B` y, para acciones destructivas en `AB`, `(seguirá en el lado X)`

## Invariantes

- `globalOrder ⊆ paneA.activeLayerIds ∪ paneB.activeLayerIds` (los IDs huérfanos se filtran al recomputar).
- El live state (`activeLayerIds`, `hiddenLayerIds`, `layerOpacities`, `filters`) **siempre espeja** a `compareMode[pane${activeSlot}]`.
- "Eliminar" desde el panel de capas activas en swipe quita la capa de **ambos** slots — para mover entre slots se usa la pildora `<SlotBadge>`.
- `swipePosition` siempre cae en `[SWIPE_POS_MIN, SWIPE_POS_MAX]` = `[0.05, 0.95]`.
- El `swipeOrientation` se persiste por usuario (`localStorage.mapalab.swipe.orientation`) y se restaura al entrar a swipe.

## Constantes (`helpers/swipeMode.js`)

| Constante | Valor | Uso |
|---|---|---|
| `SWIPE_POS_MIN` / `SWIPE_POS_MAX` | 0.05 / 0.95 | Clamp lógico en fracción |
| `SWIPE_HANDLE_MIN` / `SWIPE_HANDLE_MAX` | 5 / 95 | Clamp visual en porcentaje |
| `SWIPE_KEYBOARD_STEP` | 5 | Paso de teclado del handle |
| `SWIPE_DEBOUNCE_MS` | 200 | Debounce del `setSwipePosition` |
| `SWIPE_POS_THRESHOLD` | 0.005 | Threshold de cambio para persistir |
| `SWIPE_POS_JITTER` | 0.1 | Threshold para sincronizar pos local con compareMode |
| `SNAPSHOT_MAX_BYTES` | 100_000 | Límite del snapshot serializado en localStorage |

## Accesibilidad

- Handle del swipe: `role="slider"`, `aria-label`, `aria-orientation`, `aria-valuemin/max/now`. Acepta teclado (←/→/↑/↓ con paso de 5%, `Home`/`End` para extremos).
- Overlays "A"/"B" gigantes son `aria-hidden="true"` (decorativos).
- `<SlotBadge>` lleva `aria-label` con la oración completa de su tooltip.

## Performance

Costo inherente: en swipe son **dos `GetMap` por cada cambio de view** (uno por pane). En GCP staging (1 VM con 2 cores que comparte CPU con backend, GeoServer y nginx) ese doble request hace que el zoom sea perceptiblemente más lento. En producción real (4 servidores dedicados, GeoServer en su propio servidor con 8 cores) no se nota.

El fix de "shared View" (mismo `View` instance en los dos mapas) elimina las requests intermedias del thrashing durante una animación de zoom — pero las dos requests finales son inherentes al diseño "dos mapas independientes". Cambiarlo requeriría perder la independencia de filtros/fechas entre A y B.
