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
    <Handle />                                                   {/* barra naranja draggable, con las pastillas A <> B */}
    <OverlayA /> <OverlayB />                                    {/* solo mientras dura el resaltado */}
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

## Quién vive en cada lado y cuál estás editando

Son dos cosas distintas y cada una tiene su control, los dos fuera del item de capa:

- **Dónde vive la capa** se decide con las dos casillas de `<PanelCapas>`, una por lado, en la barra
  del comparador. La casilla del único lado que le queda va deshabilitada: `setLayerSlotMembership`
  rechaza un destino vacío, así que vaciar los dos lados se sigue haciendo con eliminar. Sustituyó a
  la píldora `<SlotBadge>`, que ciclaba `A → AB → B` en tres pasos con el estado escondido.
- **Qué lado estás editando** es `compareMode.activeSlot`, y lo cambia un solo `<Switch>` A/B en la
  barra del comparador. Gobierna todo lo que se muta desde el sider —opacidad, visibilidad, filtros
  CQL— y a qué lado entra una capa nueva del catálogo. Antes había uno por cada item con membresía
  `AB`, que repetía en cada renglón un estado que es global.

`useSymbology.stillActive` valida contra `paneA + paneB` (no solo el live state) para que el item no
se deseleccione al sacar la capa de un lado.

**Botón Eliminar en swipe** quita la capa de **ambos** slots; para dejarla en uno solo se usan las
casillas.

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
        "shared": { "view", "basemap", "selected", "municipios", "vista3d" },
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

**`vista3d`** (opcional, desde 1.204.0): `{pitch, bearing, exaggeration, extruir: [slugs]}`. Solo se escribe cuando el mapa está en 3D; en un `single` vive en `payload`, en un swipe en `payload.shared`, porque la cámara 3D es una para los dos lados. Al abrir el enlace, el deserializador la deja pendiente en `helpers/vista3dCompartida.js` y `View3dProvider` la aplica (el cargador corre fuera de ese provider, así que no puede llamarlo directo). Sin WebGL el enlace abre en 2D. `validate_payload` acota `pitch` a 0–80, `bearing` a ±180, `exaggeration` a 1–5 y `extruir` a 10 capas.

**Validación de `POST /shares`** (desde 1.205.0). Aplica igual a lo que crea el visor y a lo que crea el MCP:

| Qué | Regla |
|---|---|
| Capas | hasta 60; cada `slug` debe ser `id`, `slug` o alias de un nodo del árbol (`layer_tree_cache`). Si el árbol no se puede leer, no se bloquea |
| `filters` | objeto de hasta 20 entradas con valores simples; el largo lo acota el tope de 256 KB, porque la selección de la tabla arma CQL largos |
| `view` | `lat` 10–35, `lon` −120 – −84 (el visor no ata el centro a Jalisco), `rotation` ±360 |
| Textos | `id`, `label`, `unit`, `textLabel` de anotaciones hasta 200; etiquetas del comparador hasta 60 |
| Volumen | techo **global** de 30 por minuto y 3000 al día, contado después de validar |

El techo era de 10 por minuto «por IP», pero la IP salía del primer `X-Forwarded-For`, que manda el cliente: se evadía cambiando el encabezado, y sin él todo el sitio compartía la cuenta porque el borde entrega una sola IP. El hash de IP que se guarda sale ahora de `X-Real-IP`, que fija el nginx.

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
| Dibujar mediciones nuevas en swipe 2D | `useMapDrawing.startDrawing` opera sobre `mapRef` global (null en swipe), así que en 2D pedir Mediciones sale del comparador. **En el comparador 3D sí se mide** (1.210.0): la herramienta escucha a los mapas α y β a la vez y la capa de dibujo existe sin mapa (ver `draw.md`). *Las pre-existentes vía share ya se ven*. |
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
- Overlays "A"/"B" gigantes en `font-garet bold text-[120px]` mientras dura el resaltado: al entrar al comparador (`SWIPE_INTRO_MS`) y cada vez que `highlightedSlots` se enciende. Al apagarse, la letra viaja hasta el handle y se desvanece sobre la pastilla que queda ahí (`minimizeTransform`, `SWIPE_MINIMIZE_MS`)
- Letras `A` y `B` permanentes flanqueando el knob (`A <> B`), sin fondo, en el color de cada slot y
  con `drop-shadow` blanco para leerse sobre cualquier mitad. Son la única señal de qué lado es cuál
  una vez que los overlays se minimizan; van sin caja para no competir con el handle, que es lo que se arrastra
- `<SwipeSlotControls>`: barra inferior centrada `[nombre · A · orientación · B]` con `<DatePill autoWidth>`.
  El nombre sale de `selectedLayerForSymbology`, que es **uno solo** para los dos lados: lo que difiere
  entre A y B es la fecha de esa misma capa, no la capa. `<CloseButton>` rosa arriba si hay periodicidad seleccionada o dentro de la barra si no la hay
- Tooltips dinámicos: anexan `del lado A`/`del lado B` y, para acciones destructivas en `AB`, `(seguirá en el lado X)`

## Invariantes

- `globalOrder ⊆ paneA.activeLayerIds ∪ paneB.activeLayerIds` (los IDs huérfanos se filtran al recomputar).
- El live state (`activeLayerIds`, `hiddenLayerIds`, `layerOpacities`, `filters`) **siempre espeja** a `compareMode[pane${activeSlot}]`.
- "Eliminar" desde el panel de capas activas en swipe quita la capa de **ambos** slots — para dejarla en uno solo se usan las casillas de `<PanelCapas>`.
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
| `SWIPE_INTRO_MS` | 1200 | Cuánto se ven los overlays al entrar al comparador |
| `SWIPE_MINIMIZE_MS` | 450 | Duración del viaje de la letra hasta el handle |
| `SWIPE_HIGHLIGHT_MS` | 1500 | Apagado automático del resaltado tras un click |
| `SWIPE_MINIMIZE_SCALE` | 0.12 | Escala final de la letra (120 px → ~14 px) |
| `SWIPE_LABEL_GAP` | 38 | Separación en px entre el centro del knob y cada pastilla |

## Accesibilidad

- Handle del swipe: `role="slider"`, `aria-label`, `aria-orientation`, `aria-valuemin/max/now`. Acepta teclado (←/→/↑/↓ con paso de 5%, `Home`/`End` para extremos).
- Overlays "A"/"B" gigantes y las pastillas del handle son `aria-hidden="true"` (decorativos); el `aria-label` del slider ya nombra la posición.
- Las casillas de `<PanelCapas>` llevan tooltip con el lado y la acción; la del único lado que queda va deshabilitada y lo dice.

## Performance

Costo inherente: en swipe son **dos `GetMap` por cada cambio de view** (uno por pane). En la VM de GCP (1 VM con 2 cores que comparte CPU con backend, GeoServer y nginx) ese doble request hace que el zoom sea perceptiblemente más lento. En producción real (4 servidores dedicados, GeoServer en su propio servidor con 8 cores) no se nota.

El fix de "shared View" (mismo `View` instance en los dos mapas) elimina las requests intermedias del thrashing durante una animación de zoom — pero las dos requests finales son inherentes al diseño "dos mapas independientes". Cambiarlo requeriría perder la independencia de filtros/fechas entre A y B.
