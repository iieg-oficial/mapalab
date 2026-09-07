# InfoBox

Panel flotante que muestra informacion de features seleccionadas en el mapa. Es el consumidor principal del estado `selectedFeatureInfo` del `MapsContext`.

## Ubicacion

```
frontend/src/utils/infoboxPlan.js  # Resolucion: config + properties -> plan. Copia canonica.

frontend/src/pages/maps/components/InfoBox/
├── InfoBox.jsx                    # Componente raiz
├── hooks/
│   ├── useViewportContainment.js  # Ajuste de posicion para no salir del viewport
│   └── useDraggablePanel.js       # Arrastre del panel por su asa
├── utils/
│   ├── renderCard.jsx             # Orquesta: pide el plan y lo manda a pintar
│   ├── cardBlocks.jsx             # Pintores por tipo de bloque (PINTORES)
│   └── downloadFeatures.js        # Export CSV desde el toolbar
└── components/
    ├── InfoCard.jsx               # Wrapper compartido: shell + header adaptativo (desktop/mobile)
    ├── Header.jsx                 # Header desktop (bloque #EFF3FC) — usado por InfoCard
    ├── MobileFeatureHeader.jsx    # Header mobile (titulo + badge N/total) — usado por InfoCard
    ├── SummaryCard.jsx            # Resumen de seleccion por poligono (usa InfoCard)
    ├── EmptySuggestions.jsx       # Estado vacio + capas alternativas (usa InfoCard)
    ├── InfoBoxTools.jsx           # Fila de herramientas (descargar, etc.) para header mobile
    ├── DismissGesture.jsx         # Swipe horizontal para eliminar card (mobile)
    ├── ActionsToolbar.jsx         # Botones flotantes (cerrar / descargar) desktop multi-feature
    ├── InfoBoxArrow.jsx           # Pico que apunta al punto cuando hay una sola feature
    ├── SymbolIcon.jsx             # Icono de simbologia de la capa
    ├── Label.jsx                  # Badges de municipio, caracteristica
    ├── List.jsx                   # Pares label/valor
    ├── Cards.jsx                  # Grid de cifras (valores + sufijos + labels)
    ├── Text.jsx                   # Parrafos libres
    └── IconText.jsx               # Icono + texto con href o action
```

**Los componentes de `components/` ya no deciden nada.** Reciben valores listos —formateados,
partidos, con su href armado— y solo los pintan. Todas las decisiones viven en `infoboxPlan.js`.

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
    queriedLayerId?: string,
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

Dos pasos, a proposito separados:

1. **`buildCardPlan(properties, config, opciones)`** de `@utils/infoboxPlan` resuelve la
   configuracion contra las propiedades de la feature y devuelve un *plan*: `{ title, blocks,
   isEmpty }`, con cada bloque ya con sus valores finales.
2. `renderCard` recorre `plan.blocks` y llama al pintor de `cardBlocks.jsx` que le toca.

Bloques del cuerpo, en este orden natural: `labelGroups`, `list`, `iconText`, `text`, `cards`.
`blockOrder` lo reordena. `headerField` va siempre arriba y no participa del orden.

| Bloque | Que pinta |
|---|---|
| `headerField` | Titulo de la tarjeta. Acepta un nombre de columna o un `compose` |
| `labelGroups` | Badges con color y fondo (municipio, caracteristica) |
| `list` | Pares etiqueta/valor. `raw` no formatea, `split` parte multivalor |
| `iconText` | Icono + valor, con href automatico (tel, maps, web) o `action` |
| `text` | Parrafos, fijos o de un campo |
| `cards` | Grid de cifras, con `suffix`, `decimals` y `cardsColumns` |

**Varias instancias del mismo bloque.** Cualquiera de los cinco acepta la forma
`[{ id, items: [...] }]` en lugar del arreglo plano, y entonces sus llaves en `blockOrder` son
`list:a`, `list:b`. Sirve para poner etiquetas arriba y otras al final. **La forma plana sigue
siendo valida y es la que se guarda mientras haya una sola instancia**; solo al duplicar se
convierte, y al quedar una sola vuelve sola.

**Campos compuestos (`compose`).** Sustituye a `field` en cualquier bloque y une varias columnas
en un valor:

```json
{ "label": "Direccion",
  "compose": ["calle", { "field": "numero_ext", "prefix": "#" }, "colonia"],
  "sep": ", " }
```

Una parte vacia **se va con su `prefix` y su `suffix`**, que es lo que evita el `Calle Hidalgo #,`
con el gancho colgando. `op: "sum"` suma las partes numericas en vez de unirlas; un valor unido
nunca pasa por el formato de numeros, una suma si.

**Columnas multivalor.** `split: true` en un renglon —o `splitValues` en un grupo de etiquetas—
parte el valor por **`; `**, estricto y sin respaldo por coma. Contrato en
`ecosistema/contratos.md`.

Si la capa no trae configuracion, `generateDefaultConfig` infiere una de las propiedades del
feature. La config puede ser funcion `fn(dateFilter) => config` para variar segun fecha activa.

### `infoboxPlan.js` — copia canonica compartida

El modulo es **puro**: sin React, sin estilos y sin un solo import. Ahi vive todo lo que decide
—leer un campo sin distinguir mayusculas, unir columnas, sumar, partir por `; `, formatear numeros
y fechas, armar el href de un icono, normalizar la forma vieja, ordenar las instancias—.

**mariachi tiene una copia byte a byte** en `admin/src/shared/infoboxPlan.js`. Se edita aqui y se
sincroniza con `mariachi/scripts/sync-infobox-plan.sh`; `--check` falla si divergieron. La razon
esta en `ecosistema/contratos.md`: cuando el editor reimplementaba esta logica, los campos
compuestos funcionaban en el visor y el preview del admin los ignoraba.

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

`renderCard` y los componentes de `InfoBox/components/*` (Label, List, Cards, Text, IconText) son
agnosticos del contenedor y se reusan en ambas variantes via prop `variant`. `infoboxPlan.js` va
mas lejos: no sabe siquiera que existe React, y por eso lo consume tambien el editor de mariachi.

## Tests

| Archivo | Cubre |
|---|---|
| `test/pages/maps/components/InfoBox/utils/renderCard.helpers.test.js` | `applyHeaderTransform` y `resolveStaticValue` |
| `test/pages/maps/components/InfoBox/utils/resolveFieldValue.test.js` | Resolucion de un campo, `compose`, `op: sum`, `splitMultivalue` |
| `test/pages/maps/components/InfoBox/utils/renderCard.compose.test.jsx` | Render de campos compuestos, multivalor y columnas en mayusculas |
| `test/pages/maps/components/InfoBox/utils/renderCard.instancias.test.jsx` | Varias instancias del mismo bloque y su orden |
| `backend/test/test_layer_tree_inherit_card.py` | La herencia de grupo a propiedades |

Los dos primeros importan de `@utils/infoboxPlan`, no del InfoBox: lo que prueban es la
resolucion, no el pintado.

## Estado vacío con sugerencias (`EmptySuggestions`)

Cuando el click no encuentra features en la capa seleccionada (y no es selección por polígono), el InfoBox muestra `EmptySuggestions` con el mensaje "La capa seleccionada no tiene información en este punto." y la lista de capas alternativas con datos en ese pixel (ver "Cache de alternativas" abajo y la alt-query batcheada en `context.md`).

- **Icono de simbología**: el hook `hooks/useLayerSymbolIcon.js` resuelve un swatch icon-only de la capa via `getLegendJson` (GetLegendGraphic `format=application/json`) + `getLegendUrl` con `forceLabels:off` y `transparent`. Con varias reglas usa `&rule=<primera>` si la regla tiene `name`; si no, pide la pila completa y el CSS (`object-cover object-top`) recorta al primer swatch. El icono aparece junto al mensaje (capa consultada, requiere `queriedLayerId`) y junto al nombre de cada alternativa. Cache en memoria por `layerId` a nivel de módulo; los errores de fetch no se cachean (reintenta al siguiente render).
- **Pulso en hover (solo desktop)**: pasar el mouse sobre una alternativa dispara `pulseLayer(layer.id)` (mismo pulso del panel de capas activas) y al salir `cancelPulse()` restaura opacidades de inmediato. `cancelPulse` se expone desde `useLayerSelectionPulse` via `MapsContext`; también se invoca al hacer click en la alternativa y al desmontar el panel.
- **Telemetría**: `infobox_action` con `action: empty_suggestions_view` al aparecer el estado vacío y `action: select_alternative` al elegir una capa sugerida (ver `docs/analytics.md`).

## Cache de alternativas

Cuando `queryFeatures` no encuentra resultados en la capa primaria pero sí en otras capas activas, guarda el feature-info completo en `selectedFeatureInfo.alternativeResults` (ver `useFeatureInfo.js:140+`). Esto permite que `selectAlternativeLayer` filtre localmente al tapar una capa sugerida, **sin re-consultar GeoServer**.

- Estructura: `alternativeResults: FeatureInfoResult[]` (mismo shape que `results`)
- Cuando `layer.isGroup` es true, se filtran todos los descendientes via `collectLayersWithWMS`
- Cleanup automatico: `useEffect` en `InfoBox.jsx` escucha `activeLayerIds` y `filters` y limpia `alternativeLayers`/`alternativeResults` si el mapa cambia
- Cleanup natural: al cerrar InfoBox (`setSelectedFeatureInfo(null)`) o al hacer un nuevo click en otro punto (el objeto se reemplaza entero)

Ver el inventario completo de caches en `docs/cache.md`.

## Edicion desde mariachi

La tarjetita se edita en la pestana **Tarjetita** del editor de capas, con tres modos:

| Modo | Que es |
|---|---|
| **Lienzo** | La tarjeta *es* el editor: cada seccion se dibuja como se va a ver, se agrega con el **+** que sale entre secciones, se acomoda arrastrando y se edita tocandola. Es el modo por defecto |
| **Lista** | El editor de bloques anterior, apilados en tarjetas. Se conserva como respaldo mientras el lienzo se ejercita; su retiro esta anotado en `repos/mariachi/pendientes.md` |
| **JSON** | La configuracion cruda, para copiar y pegar entre entornos sin tocar la BD |

Lo que el editor trae y conviene conocer desde este lado:

- **Plantillas**: seis formas armadas con las columnas reales de la capa, y copiar la tarjetita de
  otra capa. Con la tarjetita vacia es la unica cosa que se ofrece.
- **Registros reales**: la vista previa pide diez features por
  `GET /geoserver/workspaces/{alias}/layers/{layer}/sample-features` y se recorren con ◀ ▶. De ahi
  salen tambien los valores de ejemplo de los selectores de campo.
- **Deshacer** con `Ctrl+Z`, agrupando los cambios seguidos.

Los presets viejos (`municipio`, `punto`, `punto_ubicacion`…) que resolvia
`layer_service.py::resolve_infobox` **siguen en el codigo de mariachi pero el editor ya no los
emite**: guarda `infobox_config` directo. El visor nunca los conocio.

## Herencia de grupo a propiedades

Una **propiedad** —hoja hija de un nodo `group`— es un filtro CQL sobre el mismo feature type, asi
que muestra la tarjetita del grupo salvo que tenga una propia.

**La herencia se resuelve al construir el arbol, no aqui.** `layer_tree_service._inherit_little_card`
le pone a cada propiedad sin tarjetita la del grupo ancestro mas cercano, mas un `inheritedFrom` con
el id de ese grupo. `InfoBox` lee el `littleCard` de la capa del clic y **no recorre ancestros**.

Por que importa: el clic se resuelve por nombre de capa de GeoServer, que el grupo y sus propiedades
**comparten**, y `layerMap[layerName]` se queda con la primera activa. Sin la propagacion en el
arbol, la tarjeta que veias dependia del orden en que se encendieron las capas.

**Ese codigo esta duplicado en `dataengine/jobs/run_refresh_layer_tree.py`** y las dos copias tienen
que emitir lo mismo, o la tarjetita de una propiedad cambia segun quien reconstruyo el cache. Ver
`ecosistema/contratos.md`. `_TREE_SCHEMA` sube cuando cambia la forma del nodo, para que los caches
viejos se invaliden solos.

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
- `ecosistema/contratos.md` — por que `infoboxPlan.js` y la propagacion viven duplicados, y el
  separador `; ` de las columnas multivalor
