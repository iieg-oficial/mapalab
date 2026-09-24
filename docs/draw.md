# Draw — subsistema de dibujo y anotaciones en el mapa

Referencia del subsistema de dibujo/medicion/anotacion (lineas, poligonos, trazo libre, seleccion, puntos, texto, emoji). Incluye el estado actual y la evolucion planeada para edicion en-mapa de anotaciones colocadas.

## Ubicacion

```
frontend/src/pages/maps/
├── hooks/
│   ├── useMapDrawing.js          # Hook central — estado de measurements + interacciones OL
│   ├── useVectorLayerSetup.js    # Crea el VectorLayer/Source donde viven las features dibujadas
│   ├── useEmojiTemplate.js       # Estado del emoji activo a colocar
│   └── useTextTemplate.js        # Estado del texto activo a colocar
├── helpers/
│   ├── drawingStyles.js          # createEmojiStyle, createTextStyle, createFreehandStyle, computeStylesForFeature, etc.
│   └── emojiCatalog.js           # Catalogo de emojis por categoria
└── components/MeasurementTools/
    ├── ToolsPanel.jsx            # Orquestador — barra principal + monta panels
    ├── ToolSelector.jsx          # Botones para elegir tipo (Linea, Poligono, Mano alzada, Seleccion, Texto, Emoji)
    ├── HistoryButton.jsx         # Abre HistoryPanel
    ├── HistoryPanel.jsx          # "Mis mediciones" — lista con toggle/eliminar/ver-seleccion
    ├── EmojiPanel.jsx            # Picker de emoji (sin controles de rotacion)
    ├── TextPanel.jsx             # Input de texto (sin controles de rotacion)
    ├── FeatureEditToolbar.jsx    # Toolbar flotante de edicion in-mapa
    ├── UndoButton.jsx            # Deshace ultimo vertice durante sketch
    └── CloseButton.jsx           # Cierra modo herramientas
```

## Tipos de medicion / anotacion

| `type` | Geometria OL | Proposito | Campos propios en el feature |
|---|---|---|---|
| `LineString` | LineString | Medir distancia | `measurementValue` (m/km) |
| `Polygon` | Polygon | Medir area | `measurementValue` (m²/km²) |
| `Freehand` | LineString (freehand) | Trazo libre | `annotationType: 'Freehand'` |
| `Select` | Polygon | Seleccionar features de capas WMS | `selectionGeometry`, `selectionCenter`, `cachedResults` |
| `Point` | Point | Reposo (sin dibujo activo) | — |
| `Text` | Point | Colocar texto en el mapa | `annotationType: 'Text'`, `textLabel`, `rotation` |
| `Emoji` | Point | Colocar emoji | `annotationType: 'Emoji'`, `textLabel`, `rotation` |

## Estado principal: `useMapDrawing`

Hook central en `hooks/useMapDrawing.js:10-675`.

### State

| Variable | Tipo | Proposito |
|---|---|---|
| `measureType` | string | Tipo activo (`'LineString'`, `'Polygon'`, `'Emoji'`, etc.) |
| `measurements` | array | Lista de metadata de cada medicion colocada (ver shape abajo) |
| `isSketching` | boolean | True mientras el usuario esta dibujando una geometria activa |
| `areMeasurementToolsVisible` | boolean | Visibilidad del panel de herramientas |
| `rotation` | number | Rotacion global (radianes) que se aplica al siguiente Text/Emoji a colocar |
| `textTemplate` / `emojiTemplate` | string | Texto/emoji activo a colocar al siguiente click |
| `measurementConfig` | object | Flags: `showLiveAngles`, `showFinalAngles`, `showMeasurementLabels`, `enableAnnotationTools` |

### Refs internos

- `vectorSourceRef` — `ol.source.Vector` donde se guardan todos los features dibujados
- `vectorLayerRef` — `ol.layer.Vector` con style dinamico `getStyleForType`
- `drawInteractionRef` — `ol.interaction.Draw` activa (se recrea al cambiar `measureType`)
- `sketchFeatureRef` — feature en construccion mientras `isSketching`
- `lastSelectGeometryRef` / `lastSelectCenterRef` — ultimo poligono de seleccion (para restaurar)
- `rotationRef`, `textTemplateRef`, `emojiTemplateRef` — refs espejo del state (usados en callbacks de OL para leer valores actualizados sin re-create de la interaccion)

### Shape de una `measurement`

```js
{
    id: string,                 // id unico
    type: 'LineString' | 'Polygon' | 'Freehand' | 'Select' | 'Text' | 'Emoji' | 'Pin',
    label: string,              // texto mostrado en HistoryPanel
    value: number | string,     // medicion (largo/area) o contenido (text/emoji)
    feature: ol.Feature,        // referencia al feature en el vectorSource
    visible: boolean,           // toggle desde HistoryPanel
    geometry?: ol.Geometry,     // solo Select — poligono guardado
    center?: [x, y],            // solo Select — centro del poligono
    cachedResults?: object[],   // solo Select — resultados WFS cacheados
    layerBreakdown?: array,     // solo Select — desglose por capa
    selectionCount?: number     // solo Select
}
```

### API expuesta

```js
const {
    measureType, measurements,
    startDrawing(type),         // activa modo de dibujo para el tipo dado
    stopDrawing(),              // desactiva modo de dibujo
    clearDrawings(),            // borra todo
    deleteMeasurement(id),
    toggleMeasurementVisibility(id),
    cancel(),
    undoLastPoint(),            // elimina ultimo vertice durante sketch
    isDrawing, isSketching,
    areMeasurementToolsVisible,
    showMeasurementTools(), hideMeasurementTools(), toggleMeasurementTools(),
    textTemplate, setTextTemplate,
    emojiTemplate, setEmojiTemplate,
    rotation, setRotation,
    measurementConfig, setMeasurementConfig,
    finishCurrentSketch(),
    restoreLastSelection(),
    showSelection(id),
    updateSelectionCount(count, breakdown, results),
    ensureVectorLayer()
} = useMapDrawing(mapRef, onPolygonComplete, onShowCachedSelection);
```

Las mutaciones reciben el `id` de la medición, no su posición en la lista: `HistoryPanel` pasa
`measurement.id`. `updateSelectionCount` escribe en la selección que disparó la consulta, guardada
en `seleccionPendienteRef` al terminar el trazo, y no en la última de la lista: si la consulta tarda
y mientras tanto se dibuja otra, el conteo no cae en la nueva.

### Ciclo de vida de la capa de dibujo

`ensureVectorLayer()` (`useVectorLayerSetup.js`) crea la fuente y la capa aunque todavía no haya
mapa, y las engancha al mapa actual si no lo están. Eso cubre dos casos en que el mapa principal no
existe o cambia:

- **Comparador:** al entrar se desmonta el `<MapView>` principal y `mapRef.current` queda en `null`.
  Al salir, el `<MapView>` nuevo llama a `ensureVectorLayer()` en cuanto tiene instancia, y las
  mediciones vuelven a verse sin recargar.
- **Guardar sin mapa:** `restoreAnnotations` ya no espera a `mapRef.current`; agrega las features a la
  fuente y la capa se engancha después. Así se guardan las mediciones hechas en el comparador 3D.

## Renderizado de estilos — `getStyleForType`

`useMapDrawing.js:106-178`. Funcion que OL llama por cada feature en la capa:

1. Si `visible === false` → retorna null (no se pinta)
2. Si hay `cachedStyle` y no es sketch → retorna cache
3. Segun `annotationType`:
   - `'Emoji'` → `createEmojiStyle(textLabel, rotation)`
   - `'Text'` → `createTextStyle(textLabel, rotation)`
   - `'Freehand'` → `createFreehandStyle()`
   - `'Select'` → `computeStylesForFeature('Select', ...)`
4. Si es sketch y `showLiveAngles` → pinta angulos en vivo
5. Fallback → `createDefaultStyle(geometryType)`

Invalidacion de cache: `feature.unset('cachedStyle', true)` + `vectorLayerRef.current.changed()`. Se usa cuando cambia `measurementConfig` o al actualizar rotacion/label.

## Flujo de un dibujo

```
[usuario selecciona herramienta desde ToolsPanel]
  → startDrawing(type)
  → remueve Draw anterior si existe
  → crea nueva ol.interaction.Draw con el tipo OL apropiado
  → la agrega al mapa

[usuario hace click en mapa]
  → drawstart: setea sketchFeature + annotationType + (textLabel, rotation si aplica)
  → (si LineString/Polygon) usuario sigue clickeando para mas vertices
  → drawend: calcula measurementValue, genera label, agrega a measurements[]

[usuario cambia de herramienta o presiona Escape]
  → stopDrawing() o finishCurrentSketch() segun el contexto
```

### Escape handling (`useMapDrawing.js:438-486`)

- Si hay sketch con suficientes puntos (≥2 para Line, ≥3 para Polygon) → termina el dibujo
- Si no → aborta y vuelve a modo Point

## Rotacion (historico)

El estado `rotation`/`setRotation` existe en `useMapDrawing` pero ya no tiene UI en los paneles de Emoji/Text — cada feature nuevo se crea con `rotation: 0`. El usuario ajusta rotacion y escala **despues** de colocar, via el toolbar de edicion in-mapa (ver seccion siguiente).

## Edicion en-mapa de Text/Emoji (Opcion A — implementado)

Permite seleccionar un Text/Emoji colocado, moverlo, rotarlo y escalarlo sin recolocarlo. Primera iteracion con toolbar flotante.

### Alternativas evaluadas

| Opcion | Esfuerzo | UX | Observaciones |
|---|---|---|---|
| **A. Seleccion + toolbar flotante** | 3-4 h | Buena | **Implementada.** Sin deps nuevas |
| B. Edit-in-place con handles HTML | 8-12 h | Excelente (tipo WhatsApp) | Requiere HammerJS para gestos mobile. Evaluar si A no basta |
| C. `ol-ext` Transform | ~2 h | Aceptable | Libreria ~400KB, handles ajenos al estilo del proyecto |

### Componentes

1. **`hooks/useMapEditing.js`**
   - Estado `selectedFeatureId`, `selectionTick` (fuerza re-render del toolbar), `editingClickedRef`
   - Click listener filtrado por `annotationType in ['Emoji', 'Text']` con `hitTolerance: 10`
   - `ol.interaction.Translate` limitado al feature seleccionado via `Collection`
   - Expone: `selectFeature`, `deselectFeature`, `updateRotation`, `updateScale`, `deleteSelected`, `selectedFeature`, `selectedMeasurement`, `editingClickedRef`
   - Escape deselecciona; cambio de `measureType`/`isDrawing` auto-deselecciona

2. **`components/MeasurementTools/FeatureEditToolbar.jsx`**
   - Render via `ol.Overlay` con `positioning: 'bottom-center'` y `offset: [0, -28]` — sigue pan/zoom automaticamente y al feature cuando se arrastra (listener `feature.on('change')`)
   - Layout compacto de 6 botones redondos `size-7`:
     - Rotar −45° (`undo`)
     - Rotar +45° (`undo` con `scale-x-[-1]`)
     - Reducir tamano (−) — step `0.25`, min `0.5`
     - Aumentar tamano (+) — step `0.25`, max `3.0`
     - Eliminar (`eliminar`) con hover rosa `#FF577D`
     - Listo (`done` inline — palomita neutral)
   - Sin input manual de grados ni porcentaje de escala (UX simplificada: tap repetidamente para ajustar)
   - Estilo: `bg-[#F9FBFF] rounded-[12px] shadow-[0_5px_20px_#1A26641A] border border-[#E6E9F0]` (patron HistoryPanel)
   - Renderiza via `createPortal` dentro del elemento del Overlay para integrar React y OL

3. **`helpers/drawingStyles.js`**
   - `createEmojiStyle(emoji, rotation = 0, scale = 1, selected = false)` y `createTextStyle(text, rotation, scale, selected)`
   - Cuando `selected=true` retornan `[halo, main]` — `CircleStyle` radio 22 con fill `rgba(112,48,138,0.18)` y stroke `#70308A`

4. **`hooks/useMapDrawing.js`**
   - `getStyleForType` lee `feature.get('scale') || 1` y `feature.get('selected') === true` y los pasa a los create*Style
   - `startDrawing` inicializa `feature.set('scale', 1)` al crear Emoji/Text
   - Return incluye `vectorSourceRef`, `vectorLayerRef`, `setMeasurements`

5. **`providers/MapsProvider.jsx`**
   - Instancia `useMapEditing` con refs/setters de `mapDrawing` y derrama en el context

6. **`hooks/useMapInteractions.js`**
   - Nuevo param opcional `editingClickedRef`
   - Si el ref esta en true, skipea el query de feature-info (similar al pattern de `markerClickedRef`)
   - Evita que al seleccionar un emoji se abra la InfoBox de WMS

7. **`components/MapView.jsx`** + **`ToolsPanel.jsx`**
   - `MapView` pasa `editingClickedRef` a `useMapInteractions`
   - `ToolsPanel` monta `<FeatureEditToolbar>` cuando hay `selectedFeature`

### Flujo

```
[click en emoji/texto colocado]
  → useMapEditing detecta via forEachFeatureAtPixel (hitTolerance: 10)
  → selectFeature(feature)
  → feature.set('selected', true); unset cachedStyle; layer.changed() (halo morado aparece)
  → editingClickedRef.current = true
  → habilita Translate con el feature en una Collection
  → FeatureEditToolbar se monta con ol.Overlay en la coordenada del feature

[drag del feature]
  → Translate mueve geometria; feature.on('change') reposiciona el Overlay
  → translateend dispara re-render del toolbar via selectionTick

[slider rotacion]
  → updateRotation(rad) → feature.set('rotation', rad); unset cachedStyle; layer.changed()

[slider escala 50-300%]
  → updateScale(num) → feature.set('scale', num); misma invalidacion

[click fuera del feature / Escape / cambio de measureType]
  → deselectFeature(): feature.set('selected', false); quita halo; remueve Translate; oculta toolbar
```

### Bordes manejados

- **Draw vs Edit**: la seleccion se bloquea mientras `isDrawing === true`. Al cambiar a cualquier `measureType !== 'Point'` auto-deselecciona
- **InfoBox no se abre** al clickear features editables (el `editingClickedRef` bloquea el query de WMS)
- **Mobile tap precision**: `hitTolerance: 10` en `forEachFeatureAtPixel`
- **Escala independiente del zoom**: `TextStyle.scale` de OL es pixel-based; no cambia con zoom del mapa (apropiado para anotaciones)
- **Rotacion global vs por-feature**: dos estados independientes — `rotation` del ToolsPanel afecta siguientes features, el toolbar afecta solo al seleccionado

### Extensiones futuras (no bloqueantes)

- **Opcion B** (edit-in-place con handles HTML tipo WhatsApp) si A no satisface
- Duplicar feature con Alt+drag
- Undo/redo de ediciones
- Multi-select con Ctrl+click
- Persistir `rotation` + `scale` si las measurements se serializan (localStorage, export JSON, etc.)

## Referencias cruzadas

- `docs/infobox.md` — patron de toolbar flotante (la idea del FeatureEditToolbar toma ese patron)
- `docs/mobile-sheet.md` — primitivo de sheet si alguna vez se migra a mobile sheet
- `docs/cache.md` — `selectedFeatureId` es state ephemeral; los `cachedResults` de `Select` estan documentados ahi
- `docs/analytics.md` — evento `drawing_tool_use` al activar una herramienta
- OL 10.8 docs: `ol/interaction/Translate`, `ol/Overlay`, `ol/style/Text`
