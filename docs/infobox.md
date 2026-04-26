# InfoBox

Panel flotante que muestra informacion de features seleccionadas en el mapa. Es el consumidor principal del estado `selectedFeatureInfo` del `MapsContext`.

## Ubicacion

```
frontend/src/pages/maps/components/InfoBox/
├── InfoBox.jsx                    # Componente raiz
├── hooks/
│   └── useViewportContainment.js  # Ajuste de posicion para no salir del viewport
├── utils/
│   ├── renderCard.jsx             # Render de cada feature segun littleCard config
│   ├── cardTemplates.js           # Templates TEEC / TDEMEC / TDEMECLU / etc.
│   └── downloadFeatures.js        # Export CSV desde el toolbar
└── components/
    ├── InfoCard.jsx               # Wrapper compartido: shell + header adaptativo (desktop/mobile)
    ├── Header.jsx                 # Header desktop (bloque #EFF3FC) — usado por InfoCard
    ├── MobileFeatureHeader.jsx    # Header mobile (titulo + badge N/total) — usado por InfoCard
    ├── SummaryCard.jsx            # Resumen de seleccion por poligono (usa InfoCard)
    ├── EmptySuggestions.jsx       # "No hay resultados aqui" + capas alternativas (usa InfoCard)
    ├── InfoBoxTools.jsx           # Fila de herramientas (descargar, etc.) para header mobile
    ├── SwipeToRemove.jsx          # Wrapper de swipe horizontal para eliminar card (mobile)
    ├── ActionsToolbar.jsx         # Botones flotantes (cerrar / descargar) desktop multi-feature
    ├── Label.jsx / LabelGroup.jsx # Badges de municipio, caracteristica
    ├── List.jsx                   # Pares label/valor con formateo
    ├── Cards.jsx                  # Grid de stats (valores + sufijos + labels)
    ├── Text.jsx                   # Parrafos libres
    └── IconText.jsx               # Icono + texto con href o action
```

## Estado de entrada: `selectedFeatureInfo`

```js
{
    lngLat: { lng, lat },
    results: [
        {
            layerId: 'workspace:layer' | 'marker_xxx',
            layerName: string,
            features: [{ id, properties }],
            totalFeatures: number,
            littleCard: object | fn(dateFilter) => object
        }
    ],
    isPolygonSelection?: boolean,
    queriedLayerName?: string,
    alternativeLayers?: [{ id, name, count, isGroup }]
}
```

### Disparadores (quienes llaman `setSelectedFeatureInfo`)

| Origen | Archivo | Linea | Caso |
|---|---|---|---|
| Click normal en mapa | `hooks/useFeatureInfo.js` | ~100 | WMS GetFeatureInfo sobre capas activas |
| Capa alternativa sugerida | `hooks/useFeatureInfo.js` | ~140 | No hay hit en capa activa pero si en otra |
| Click en marker | `hooks/useMapMarker.js` | `openMarkerCard` | Feature con `markerInfoBox` |
| Marker con `openOnShow` | `hooks/useMapMarker.js` | `showMarker` callback | Callback de `view.animate` |
| Seleccion por poligono | `providers/MapsProvider.jsx` | `handleShowCachedSelection` | Despues de `useMapDrawing` |

## Posicionamiento (desktop)

El panel usa `position: fixed` anclado al pixel del click.

1. **Pixel base** — `useClickPosition` acepta `originalEvent.clientX/Y` (click nativo), `pixel` (arreglo de OL) o `clientX/Y` directo. Se guarda en `{ x, y }`.
2. **Offset segun cantidad de features** (`InfoBox.jsx:81`):
   - Single feature: `{ x: 0, y: -12 }`
   - Multiples: `{ x: 12, y: -24 }`
3. **Transform CSS** (`InfoBox.jsx:129`):
   - Single: `-translate-x-1/2 -translate-y-full` (bottom-center del panel en el pixel, flechita apuntando al feature)
   - Multiples: sin transform (esquina superior-izquierda en el click)
4. **Flechita decorativa** (`InfoBox.jsx:134-142`):
   - Single: triangulo blanco abajo-centro que apunta al feature
   - Multiples: triangulo `#EFF3FC` a la izquierda

### `useViewportContainment`

Hook en `InfoBox/hooks/useViewportContainment.js` que recorre el panel con `ResizeObserver` + `useLayoutEffect` y lo reubica si se sale del viewport:
- Margen por defecto 10px
- Desplaza `left` si toca borde horizontal
- Desplaza `top` si toca borde vertical
- Si excede arriba y abajo a la vez, aplica `maxHeight = viewportHeight - 20px`

**Limitacion importante:** ajusta `left/top` pero no mueve el triangulito, asi que tras el reajuste la flecha puede dejar de apuntar al feature.

## Contenido renderizado

Jerarquia condicional dentro del panel (`InfoBox.jsx:124-205`):

| Condicion | Componente |
|---|---|
| `isPolygonSelection` | `SummaryCard` — total + desglose por capa + expandible |
| `showEmptySuggestions` (sin resultados pero hay `queriedLayerName` o `alternativeLayers`) | `EmptySuggestions` |
| `showNoLayerSelected` (sin capas activas relevantes) | Mensaje "Selecciona una capa..." |
| Otros | `results.map() → features.map()` con `renderCard()` |
| `totalFeatures > 1` | `ActionsToolbar` flotante al lado |

### `renderCard()` (utils/renderCard.jsx)

Render basado en la config `littleCard`. Reutilizable y completamente desacoplado del contenedor.

Bloques soportados:
- `headerField` — titulo del header
- `labelGroups` — Labels con color y bg (municipio, caracteristica)
- `dividers` / `labels` individuales
- `cards` — grid de stats con sufijos e iconos (detecta genero)
- `list` — pares label/valor con formateo de fechas/numeros
- `iconText` — iconos con href (tel, maps) o action (`whats_new`)
- `text` — parrafos

Los templates disponibles viven en `helpers/templates/` (referenciados en `context.md`): TEEC, TDEMEC, TDEMECLU, TDEMECLUEV, TEEMLXEV, `createMunicipioConfig`.

La config puede ser funcion `fn(dateFilter) => config` para variar segun fecha activa.

## Ciclo de vida e interaccion

| Evento | Logica |
|---|---|
| Mount / cambio de `selectedFeatureInfo` | Reset de `interactive=false`, analytics `trackFeatureClick(layerId)`, `setTimeout 200ms → interactive=true` |
| `handleClose` | `setSelectedFeatureInfo(null)` + `clearPosition()` + reset de estados locales |
| `handleRemoveFeature` | Elimina un feature del array; si no quedan, cierra |
| `handleToggleExpand` | Toggle de `isExpanded` con 50ms de loading (para `SummaryCard`) |
| `handleSelectAlternative` | Llama `selectAlternativeLayer()` y cierra |
| `handleAction('whats_new')` | Abre `WhatsNewModal` |
| `handleDownload` | `downloadFeaturesAsCSV(results)` desde el toolbar |
| Click fuera del panel | `useOutsideClick([panelRef], handleClose)` |

### Delay de 200ms en `pointer-events`

`InfoBox.jsx:171` aplica `pointerEvents: interactive ? 'auto' : 'none'` los primeros 200ms tras abrir. Evita que el tap que abrio el panel dispare sin querer un link o boton interno.

## Tamanos y estilos

- Ancho del panel: **`w-[239px]` fijo** (`InfoBox.jsx:133`, `Header.jsx`, `EmptySuggestions.jsx`)
- Altura: `max-h-[60vh]` con scroll oculto cuando hay multiples features
- z-index: `z-50` (igual que `Panel`, `Modal`, `MobileMenu`; el orden DOM decide conflictos)
- Transiciones: sin animacion de entrada propia

## Comportamiento en mobile

El componente bifurca su render segun `useSider().isMobile`.

### Rama mobile — bottom-sheet

En mobile el InfoBox se monta dentro de un `MobileSheet` (ver `docs/mobile-sheet.md`) con esta estructura:

```
┌─────────────────────────────────┐
│ Información (n)            [×]  │  ← titulo + cerrar
│ ⬇ Descargar seleccionadas       │  ← <InfoBoxTools> (shrink-0)
├─────────────────────────────────┤
│ ↕ Hay mas arriba                │  ← indicador (canScrollUp)
├─────────────────────────────────┤
│                                 │
│   <EmptySuggestions / cards>    │  ← flex-1 overflow-y-auto
│                                 │
├─────────────────────────────────┤
│ ↕ Hay mas abajo                 │  ← indicador (canScrollDown)
└─────────────────────────────────┘
```

Detalles:
- `useScrollOverflow(mobileScrollRef, { enabled: isMobile })` determina `canScrollUp`/`canScrollDown` y muestra los hints cuando aplican
- El header tiene una fila con titulo + `MobileSheetCloseButton`, y debajo la seccion `<InfoBoxTools>`
- `InfoBoxTools` recibe un array de `{ id, icon, label, tooltip?, onClick, disabled? }` y renderiza una fila de acciones con hover morado (`#5C2472`). Esta pensado para crecer en el futuro (compartir, filtrar, copiar, etc.)
- La herramienta `Descargar N tarjeta(s)` aparece solo cuando `totalFeatures > 1`, muestra el contador en naranja (`#FF8300`) y lleva el tooltip legal de `LicenseTooltipContent`
- Cada card usa `MobileFeatureHeader` (barra lateral morada + titulo, sin bloque `#EFF3FC`) en vez del `Header` desktop. La bifurcacion vive en `renderCard(variant)` pasando `'mobile'` desde `InfoBox`
- Cada card se envuelve en `SwipeToRemove` — deslizar horizontalmente (umbral 100px) elimina la tarjeta. Muestra etiqueta "Desliza para eliminar" (gris) y "Eliminando…" (rosa) cruzando el umbral. No hay boton X en el header mobile para evitar saturacion
- Al confirmar el swipe, `SwipeToRemove` mide `offsetHeight` del wrapper, fija esa altura y transiciona `max-height` y `margin-top` a `0px` (220ms ease-out) en paralelo con el `translateX` horizontal. Esto evita el salto de las cards restantes: se deslizan hacia arriba ocupando el espacio que va liberando la card eliminada
- `renderCard(variant='mobile')` propaga `variant` a `Text`, `List`, `Cards`, `IconText`, `Label` para usar tipografias mas grandes (`text-[12px]` vs `text-[10px]` desktop). Los `Cards` fuerzan `grid-cols-2` aunque el template no lo especifique
- El area scrollable usa `<ScrollContainer>` (`@components/ScrollContainer`) con `overlayFade` + `overlayColor="#F9FBFF"`, que ya incluye las flechas bounce arriba/abajo y el gradient fade
- `useViewportContainment` queda inerte porque `panelRef.current` es `null` (el panel desktop no se renderiza)
- `useOutsideClick` recibe `undefined` como `onOutside` en mobile — el cierre lo maneja `MobileSheet` via Escape / backdrop
- `renderCard`, `SummaryCard`, `EmptySuggestions` y el estado "Selecciona una capa" se reusan sin cambios
- `Header` y `EmptySuggestions` usan `w-full` para adaptarse al ancho del sheet (en desktop el padre sigue imponiendo `w-[239px]`)
- El delay de 200ms en `pointer-events` se conserva (aplica al contenedor scrollable)

### Rama desktop — panel flotante

Sin cambios. Mantiene:
- `position: fixed` anclado al pixel del click
- Ancho fijo `w-[239px]` en el wrapper padre
- Flechita que apunta al feature
- `useViewportContainment` activo
- `useOutsideClick` con `handleClose`

## `InfoCard` — wrapper compartido

Todos los estados del InfoBox (features, EmptySuggestions, SummaryCard, showNoLayerSelected) viven dentro de un `<InfoCard>` que centraliza la cascara y el header. Evita duplicar `bg-white rounded-[10px] shadow-[0px_6px_12px_#2F495C14]` + los 3 estilos de header que antes existian dispersos.

### API

```jsx
<InfoCard
    title={string}               // opcional — si esta, pinta el header
    variant="desktop|mobile"     // controla que header se usa
    index={number}               // solo mobile: badge N/total
    total={number}               // solo mobile
    onClose={fn}                 // solo desktop: muestra X en el header
    maxHeightClass={string}      // opcional: aplica flex-col + max-h
    className={string}
>
    {body}
</InfoCard>
```

Internamente:
- `variant='desktop'` + `title` → pinta `Header` (bloque `#EFF3FC` de 61px con X)
- `variant='mobile'` + `title` → pinta `MobileFeatureHeader` (titulo plano + badge `N/total`)
- Sin `title` → solo cascara con `children`

### Consumidores

| Componente | Como lo usa |
|---|---|
| `renderCard` | Devuelve `<InfoCard title={headerField} variant={...} index={...} total={...}>` envolviendo el body |
| `EmptySuggestions` | `<InfoCard title={queriedLayerName}>` con lista de capas alternativas |
| `SummaryCard` | `<InfoCard title="Resumen de seleccion" maxHeightClass="max-h-[60vh]">` con scroll interno |
| Estado "sin capa seleccionada" | `<InfoCard>` sin title, solo mensaje |

Desktop queda idéntico al diseño previo (todos los consumidores por default usan `variant='desktop'`).

## Piezas reutilizables

`InfoBox/utils/*` (renderCard, templates de `littleCard`) y `InfoBox/components/*` (Label, List, Cards, Text, IconText, IconText) son agnosticos del contenedor y se reusan en ambas variantes via prop `variant`.

## Tests

No hay tests automatizados para el InfoBox. Cualquier rediseno deberia acompanarse de cobertura basica en `test/`.

## Cache de alternativas

Cuando `queryFeatures` no encuentra resultados en la capa primaria pero sí en otras capas activas, guarda el feature-info completo en `selectedFeatureInfo.alternativeResults` (ver `useFeatureInfo.js:140+`). Esto permite que `selectAlternativeLayer` filtre localmente al tapar una capa sugerida, **sin re-consultar GeoServer**.

- Estructura: `alternativeResults: FeatureInfoResult[]` (mismo shape que `results`)
- Cuando `layer.isGroup` es true, se filtran todos los descendientes via `collectLayersWithWMS`
- Cleanup automatico: `useEffect` en `InfoBox.jsx` escucha `activeLayerIds` y `filters` y limpia `alternativeLayers`/`alternativeResults` si el mapa cambia
- Cleanup natural: al cerrar InfoBox (`setSelectedFeatureInfo(null)`) o al hacer un nuevo click en otro punto (el objeto se reemplaza entero)

Ver el inventario completo de caches en `docs/cache.md`.

## Edicion desde mariachi (v1.7.0+)

El administrador puede configurar el InfoBox de cada capa desde el drawer en `/administrador/mapalab/layers`. Los presets disponibles son:

| Preset | Campos que renderiza |
|---|---|
| `municipio` | header + badge municipio + fecha + text libre + cards de stats |
| `punto` | header + badge caracteristica |
| `punto_municipio` | header + badge municipio + badge caracteristica |
| `punto_ubicacion` | header + badge municipio + N badges de caracteristicas + list + iconText |
| `punto_completo` | idem `punto_ubicacion` + stats + text libre |
| `custom` | JSON libre (compatible con la estructura que el renderer espera) |

Componentes en mariachi admin (`src/components/layersEditor/`):

- `InfoBoxPresetForm.jsx` — formulario con los campos del preset seleccionado (`Select mode="tags"` para arrays de caracteristicas/list/iconTexts).
- `InfoBoxJsonEditor.jsx` — textarea monospace con validacion JSON en vivo; usa `key={layer.id}` para evitar que el estado local persista entre capas distintas.
- `InfoBoxPreview.jsx` — render visual con datos dummy (nombre, municipio, tipo, fecha, direccion, etc.) para que el editor vea en vivo como queda el InfoBox antes de guardar.

La resolucion de params → `infobox_config` ocurre en mariachi API (`app/services/layer_service.py::resolve_infobox`). El frontend del visor consume el `infoboxConfig` ya resuelto (sin conocer el preset).

## Lazy load + total real (v1.11.0)

Cuando se hace click sobre un punto donde se apilan muchos features (clusters densos), el InfoBox ya no muestra solo 50 sin saber el total. Implementacion:

### Doble fetch WMS en paralelo

`useFeatureInfo.queryFeatures` lanza dos `GetFeatureInfo` simultaneos al mismo pixel + bbox:

| Fetch | `FEATURE_COUNT` | Proposito |
|---|---|---|
| Primario | 50 (`FEATURE_COUNT_CAP`) | Paint inicial rapido — primeras 50 cards |
| Total | 2000 (`FEATURE_COUNT_TOTAL`) | Conocer total real + cachear features para lazy load instantaneo |

El segundo fetch alimenta `result.cachedFeatures` y `result.totalAvailable`. Si el cluster tiene >2000 features, `cappedAtLimit = true` y el contador muestra `2000+`.

**Por que doble fetch WMS y no WFS hits**: WMS es el mismo endpoint que ya consume el visor, sin riesgos de CORS/version/auth distintos. WFS `resultType=hits` resulto fragil en algunos GeoServers (no responde con `numberMatched`/`numberOfFeatures`).

### Lazy load por slicing local

`useLoadMoreFeatures` no hace requests adicionales. Slicea desde `cachedFeatures`:

```javascript
const nextCap = Math.min(currentLen + pageSize, total);
const nextFeatures = cache.slice(0, nextCap);
```

`useInfoBoxLazyLoad` monta un `IntersectionObserver` con sentinel al final del listado. **Auto-detecta el contenedor scrolleable ancestro** caminando el DOM hacia arriba hasta encontrar un padre con `overflow-y: auto/scroll` — funciona identico en mobile (dentro de `MobileSheet`/`ScrollContainer`) y desktop (dentro del `ScrollContainer` que ahora envuelve el listado en lugar de un `<div max-h-[60vh] overflow-y-auto>` plano).

### Contador por card

Cada card muestra `${index}/${totalAvailable}` (ej. `1/482`). Antes mostraba `${index}/${visible}` (ej. `1/50`), confundiendo al usuario sobre cuantos features hay realmente. La separacion entre `features` (visible, controla que cards se renderizan) y `cachedFeatures` (full, alimenta el counter y el download) lo permite.

### Decremento al eliminar card

`handleRemoveFeature` filtra del `cachedFeatures` por **referencia** (con fallback por `id`). Para que esto funcione, `useFeatureInfo` inicializa `features = cachedFeatures.slice(0, displayCap)` — ambos arrays comparten referencias a los mismos objetos. Sin esto, el filter por id no decrementaba porque las dos fetches WMS devuelven objetos distintos aunque representen las mismas features.

### Header del card

`Header.jsx` cambio de `flex` con 3 columnas (`w-10` counter + `flex-1` titulo + `w-10` X) a:

- Container `position: relative` con `px-12 py-2`
- Counter `position: absolute left-2 top-2`
- X `position: absolute right-2 top-2`
- Titulo `w-full text-center my-3 break-words`

El titulo se centra respecto al **header completo**, sin importar el ancho del counter (`200/482`, `9999/99999`, etc.). El padding lateral (48px) reserva espacio visual para los flotantes; `my-3` separa el titulo verticalmente del counter+X.

### Boton Descargar (desktop)

`ActionsToolbar.jsx` ahora muestra un badge naranja en bottom-right del boton con el `downloadDisplayCount` (= `totalAvailable` capado a 5000). Tooltip detallado: "Descargar 482 de 482 tarjetas". Cuando `cappedAtFetchLimit && !hasMoreKnown`, aparece como `2000+`.

### Hooks y archivos nuevos

- `hooks/useInfoBoxLazyLoad.js` — observer + counts agregados + enrichResultsForDownload
- `hooks/useLoadMoreFeatures.js` — slicing del cache (sin red)
- `services/featureInfoPagination.js` — helpers WFS (legacy hits + GetFeature paginado, no en uso por main flow)

### Constantes

- `FEATURE_COUNT_CAP = 50` (display inicial, fetch primario)
- `FEATURE_COUNT_TOTAL = 2000` (cap del fetch paralelo, fuente de cache)
- `DOWNLOAD_HARD_CAP = 5000` (limite de descarga CSV desde InfoBox)

## Referencias cruzadas

- `docs/markers.md` — markers con `infoBox` y flag `openOnShow`
- `docs/analytics.md` — evento `feature_click`
- `docs/cache.md` — inventario de todos los caches del proyecto
- `docs/layers.md` — arquitectura completa del sistema de capas
