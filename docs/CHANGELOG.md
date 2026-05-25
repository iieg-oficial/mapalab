# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere a [Versionado Semantico](https://semver.org/lang/es/).

## [1.47.1] - 2026-05-25

### Agregado: soporte de color hex personalizado en el resaltado de feature

El hook `useFeatureHighlight` ahora acepta valores hex `#RRGGBB` en `node.highlightColor`. Si el valor matchea el patrón hex, genera el preset dinámicamente: stroke con ese color exacto y fill con alpha 15% (`${hex}26`). Los 3 presets nombrados (`morado`/`naranja`/`sombreado`) siguen funcionando.

Sin breaking changes — un admin puede dejar los valores `morado`/`naranja`/`sombreado` como estaban o pasar a hex desde el modal global en mariachi-admin.

`isValidColorValue` permite los 3 presets + hex válido en `resolveLayerHighlight`. Los valores inválidos caen al default `morado`.

#### Que cambio

- **`frontend/src/pages/maps/hooks/useFeatureHighlight.js`**: `HEX_PATTERN` regex, `presetForHex(hex)` función, `buildStyle` chequea hex antes de buscar en `COLOR_PRESETS`, `resolveLayerHighlight` valida hex también en la cadena de ancestros.

---

## [1.47.0] - 2026-05-25

### Agregado: InfoBox arrastrable con flecha dinámica + resaltado configurable por capa

#### Panel del InfoBox arrastrable (desktop)

Nuevo botón **Mover** en `ActionsToolbar` (ícono de 4 flechas en cruz) entre Cerrar y Descargar. Arrastrarlo reubica el panel a cualquier parte del viewport cuando estorba sobre un feature del mapa. El hook `useDraggablePanel` aplica `transform: translate(dx, dy)` directo al DOM durante el drag (sin re-renders por frame); al soltar hace un único `setState`. El `baseTransform` (`translate(-50%, -100%)` para single feature) llega como prop y se compone con el offset, evitando el bug del segundo drag explosivo.

`useViewportContainment` acepta nueva prop `paused` que `InfoBox.jsx` setea a `isDragging`. Mientras el usuario arrastra, el containment no toca `el.style.left/top`. Solo mobile mantiene el bottom-sheet sin drag.

#### Flecha dinámica que sigue al feature

El triángulo CSS estático fue reemplazado por `<InfoBoxArrow />`, un SVG `position: fixed` con `<polygon>` que se actualiza via `requestAnimationFrame`. Reacciona a tres movimientos:

1. Pan/zoom del mapa → el pixel del feature cambia, la flecha se reposiciona.
2. Drag manual del panel → la flecha decide automáticamente el lado del card más cercano al feature.
3. Reubicación por `useViewportContainment` → la flecha se reajusta desde el `getBoundingClientRect()`.

Detalles del cálculo:
- Lado por proporciones (`halfW/|dx|` vs `halfH/|dy|`).
- Anchor con clamp `CORNER_PADDING = ARROW_HALF_WIDTH + 6 = 24px` para no caer en esquinas.
- Ángulo siempre perpendicular al lado (0°/90°/180°/-90°) — más limpio que apuntar diagonal al feature exacto.
- Si el feature cae dentro del card (margen 8px), la flecha se oculta.

El polygon usa `cardRef` (el `<div w-[239px]>`), no el wrapper que incluye el `ActionsToolbar`. Así la flecha del lado derecho se pega al borde del card, no del toolbar.

Sombra direccional con `filter: drop-shadow(dx, dy, blur)` calculada desde `angleDeg` (`cos/sin * 3px`). SVG en `zIndex: 4` (debajo del card `z-5`) para que la sombra que difumina hacia el card quede tapada por el `bg-white` — solo se ve la sombra fuera del card.

Cuando el anchor cae sobre el área del header del card (`anchorY < top + 61px`), el polygon se rellena con `#EFF3FC` (gris del header) para verse continuo. En el cuerpo del card es blanco normal.

Offset inicial del panel: ahora usa `-ARROW_TIP` (= -28) en Y para single feature y `+ARROW_TIP` en X para multi feature, así la punta de la flecha cae exactamente sobre el pixel del feature al abrir el InfoBox.

#### Resaltado de feature seleccionado por capa (con propagación)

Nuevo hook `useFeatureHighlight` montado en `MapsProvider` que pinta un `VectorLayer` (`zIndex: 998`) con las geometrías de los features del InfoBox abierto. Dos dimensiones configurables desde mariachi-admin tab "Apariencia":

- **`highlightColor`**: `morado` (default), `naranja`, `sombreado`.
- **`highlightShape`**: `area` (default, área + línea), `linea` (solo contorno, fill transparente), `off` (sin resaltado).

**Propagación**: una leaf hereda los campos del primer ancestor (`group`/`category`/`label`/`tema`) que los defina. Nuevo helper `findAncestorChain(layerId, allLayers)` en `layers/utils/layerHelpers.js` retorna `[self, parent, ..., root]`. `resolveLayerHighlight` recorre la cadena buscando por cada dimensión independientemente — así puedes definir color en el `tema` y forma en el `group` y la leaf hereda ambos.

#### Centrar selección desde el InfoBox

Nuevo botón **Centrar grupo** en `ActionsToolbar` y como tool en mobile. Hace `view.fit` al bbox combinado de todos los features del InfoBox. En swipe usa el pane activo.

Helpers nuevos en `helpers/featureGeometry.js`: `parseResultsFeatures`, `computeFeaturesExtent`, `getExtentCenter`, `centerOnResults` (incluye reposicionamiento del `clickPosition` al centro tras el fit, para que la flecha siga apuntando).

#### Que cambio

- **`frontend/src/pages/maps/components/InfoBox/components/InfoBoxArrow.jsx`** (nuevo).
- **`frontend/src/pages/maps/components/InfoBox/hooks/useDraggablePanel.js`** (nuevo).
- **`frontend/src/pages/maps/hooks/useFeatureHighlight.js`** (nuevo).
- **`frontend/src/pages/maps/helpers/featureGeometry.js`** (nuevo).
- **`frontend/src/pages/maps/helpers/layers/utils/layerHelpers.js`**: `findAncestorChain`.
- **`frontend/src/components/Icon.jsx`**: nuevos inline icons `center_group` y `move_arrows` (renombrados para no colisionar con los external SVGs `fit_extent` y `move` del panel de capas activas).
- **`frontend/src/pages/maps/components/InfoBox/InfoBox.jsx`**: `cardRef` separado, drag, render `<InfoBoxArrow>`, `handleCenterGroup`.
- **`frontend/src/pages/maps/components/InfoBox/components/ActionsToolbar.jsx`**: botones nuevos.
- **`frontend/src/pages/maps/components/InfoBox/hooks/useViewportContainment.js`**: prop `paused`.
- **`frontend/src/providers/MapsProvider.jsx`**: monta `useFeatureHighlight`.
- **`backend/app/models/layer.py`**: columnas `highlight_color` y `highlight_shape`.
- **`backend/app/services/layer_tree_service.py`**: expone los campos en `/layers/tree`.

#### Compatibilidad

Requiere migration **0014** de dataengine (columnas `highlight_color` y `highlight_shape` en `mapalab.layers`). Asegurar que `make migrate` se ejecutó antes del deploy.

---

## [1.46.0] - 2026-05-25

### Botón global de dato curioso siempre visible en el sider

El `<EventoFunButton>` solo aparecía dentro del panel del evento (vía `<EventoActionsBar>`). Eso significa que el usuario no descubría la mecánica de "datos curiosos" hasta abrir un evento, perdiendo afordancia. Ahora hay un **botón global** anclado debajo del `<SiderModeButton>` (botón de control de lockMode del sider), siempre visible en desktop. Comparte componente con el del panel — sin duplicar lógica de animación, popover, bolas, ni telemetría.

#### Comportamiento

- **Panel del evento cerrado** (`!activeEvento`) → el botón aparece en el sider, debajo del SiderModeButton, tamaño compacto `size-8` (32×32) pegado al SiderModeButton sin gap. Usa el `funIcon` del **primer evento con facts** para el ícono estático (dinámico, configurado desde mariachi por evento).
- **Panel del evento abierto** (`activeEvento`) → el del sider se oculta automáticamente, y aparece el mismo componente dentro de `<EventoActionsBar>` con su tamaño original (`size-7`/`size-6` md) y el `funIcon` específico del evento abierto.

Resultado: un solo botón visible a la vez, sin solapamiento, con afordancia continua independientemente del estado del panel.

#### Cambios técnicos

- **`EventoFunButton.jsx`**: ahora acepta props `sizeClass` e `iconSize` (defaults `'w-7 h-7 md:w-6 md:h-6'` y `16` para preservar comportamiento previo dentro de `EventoActionsBar`).
- **`helpers/funFactPicker.js`**: nuevo export `aggregateFactsFromEventos(eventos)` que junta facts de todos los eventos preservando símbolos por fact (cada fact mantiene su `symbol`, con fallback al `funIcon` del evento padre). Las bolas animadas del botón global muestran el símbolo correcto por fact.
- **`MapSider.jsx`**:
  - Importa `useEventoContext` (ya estaba), extrae `activeEvento` del contexto.
  - Construye `globalFactsEvento = { id: 'sider-global-facts', facts, funIcon }` memoizado por `eventos`. `funIcon` toma del primer evento con facts.
  - Renderiza `<EventoFunButton evento={globalFactsEvento} sizeClass="size-8" iconSize={22} />` cuando `!activeEvento && facts.length > 0`, en un contenedor absoluto `right-0 bottom-0 translate-x-1/2 translate-y-[calc(50%+32px)]` (pegado directamente al SiderModeButton sin gap).
  - El `SiderModeButton` ahora está **siempre visible** (antes se desvanecía con `opacity-0` cuando `lockMode === 'auto'` y no había hover). Removida la state `showModeBtn` y los handlers `onMouseEnter`/`onMouseLeave` que la alimentaban (3 lugares).

#### Justificación de tamaño + posicionamiento

El SiderModeButton es 40×40 (`img className="size-10"`). El FunButton del sider quedó en 32×32 para verse visualmente "del mismo tamaño" que el ícono del SiderModeButton (que ocupa ~28-32px efectivos dentro de su PNG, no los 40 nominales) — match perceptual, no nominal. El offset vertical `calc(50%+32px)` deja el FunButton tocando la base del SiderModeButton sin gap.

---

## [1.45.1] - 2026-05-25

### Documentación: recetas end-to-end de los tools nuevos del MCP

Los snippets curl de §Cómo probar muestran cada tool aislado. Faltaba documentar el **flujo combinado** que un agente conversacional realmente ejecuta: medir → resaltar la zona → entregar el share. Tres recetas nuevas en `docs/mcp.md §Recetas`:

- **Receta 1 — Medir un polígono y crear un share con la zona resaltada:** `measure_geometry` para calcular el área, luego `create_single_share` con el **mismo** polígono dentro de `annotations[]` (preservando `value`/`unit` del paso 1) más un `Text` annotation con la etiqueta del análisis. El usuario ve la métrica en texto y el mapa interactivo en el chat.
- **Receta 2 — Comparación A|B con swipe:** `create_swipe_share` con `pane_a_layers` y `pane_b_layers`, `label_a`/`label_b` para la píldora inferior del visor. Caso típico: "compara homicidios vs población".
- **Receta 3 — Swipe con anotaciones compartidas:** `create_swipe_share` + `annotations[]` (Polygon + Emoji). Las anotaciones se pintan sobre **ambos** paneles porque son globales del mapa, no por slot — alineado con la decisión documentada en `docs/swipe.md §Pendientes`.

Cada receta incluye el `curl` exacto, el resultado esperado, y una descripción de qué ve el usuario final. Cierra con el patrón general `medición → annotation`: cuando el análisis del agente produce una geometría, reusa la **misma** `geometry` en el share para que el contexto del análisis se preserve.

Solo documentación.

---

## [1.45.0] - 2026-05-25

### Cambiado (BREAKING): URLs del MCP movidas de `/api/mcp` y `/mapalab/api/mcp` → `/mcp` y `/mapalab/mcp`

El MCP de mapalab vivía bajo `/api/mcp/` y `/mapalab/api/mcp/`, heredado de cuando se pensó como "una API más" del backend. Pero el MCP no es REST — es JSON-RPC sobre HTTP streamable, conceptualmente un protocolo distinto que convive con el API en lugar de "dentro" de él. La convención dominante en la industria (FastMCP default `path='/mcp'`, Cloudflare remote MCP servers, modelcontextprotocol.io examples) lo monta al nivel raíz del servicio sin prefijo `/api`.

Aprovechamos que los únicos clientes hoy son de prueba (admin playground en mariachi + curl manual) para hacer el corte limpio en lugar de mantener compat. Las URLs viejas devuelven 404 a partir de esta versión.

#### URLs

| Antes | Ahora |
|---|---|
| `https://<dominio>/api/mcp[/]` | `https://<dominio>/mcp[/]` |
| `https://<dominio>/mapalab/api/mcp[/]` | `https://<dominio>/mapalab/mcp[/]` |
| `http://mapalab-mcp:8000/mcp` (interna) | sin cambios |

#### Cambios concretos

- **`nginx/nginx.conf`**: removidas las cuatro locations `= /api/mcp[/]` y `= /mapalab/api/mcp[/]`. Agregadas `= /mcp[/]` y `= /mapalab/mcp[/]` con el mismo `proxy_buffering off` / `proxy_cache off` / timeouts de 600s. El upstream `mapalab_mcp` no cambia. La location general `= /mapalab/api/metrics { return 403 }` se mantiene.
- **`docs/mcp.md`**: §Rutas y §Configuración de nginx actualizadas. Todas las URLs de los ejemplos curl, Claude Desktop config, FastMCP client, LangChain adapter usan ahora `/mcp` y `/mapalab/mcp`. Nota explícita: "Sin prefijo `/api` — alineado con la convención industrial".
- **`docs/context.md`**: §MCP server refleja las URLs nuevas + nota histórica sobre el cambio.

#### Verificación e2e (todas con `mapalab-nginx`)

```
POST /mapalab/mcp[/]   → 200 SSE  ✅
POST /mcp[/]           → 200 SSE  ✅
POST /mapalab/api/mcp[/] → 404 {"detail":"Not Found"}  (correcto, ya no existe)
POST /api/mcp[/]         → 404
```

#### Para clientes existentes

- **Claude Desktop, IDEs MCP, IGIBot, langchain-mcp-adapters, etc.**: actualizar la URL en su config de `/mapalab/api/mcp/` a `/mapalab/mcp/`.
- **Playground del admin mariachi**: actualizado en `admin 1.15.3` (commit separado en `mariachi`).
- **Tests automáticos del MCP**: hardcodean URLs en su config — ajustar.

Sin cambios en `servers/mapalab.py` ni en los tools del MCP. El servidor sigue exponiendo el mismo conjunto de tools, solo cambia el path por donde nginx los expone al exterior.

---

## [1.44.1] - 2026-05-25

### Documentación: `docs/mcp.md` con ejemplos `curl tools/call` para los 3 tools nuevos

Faltaba en `docs/mcp.md §Cómo probar` la forma exacta de probar los tools nuevos de 1.44.0 desde la terminal sin levantar un cliente MCP completo. Útil para smoke-test post-deploy en GCP y para que el equipo de IGIBot tenga snippets copy-paste listos.

- **`docs/mcp.md`**: dos secciones nuevas en §Cómo probar:
  - `curl (tools/list)` — listar los 14 tools registrados
  - `curl (tools/call)` — 4 ejemplos completos (`measure_geometry` LineString, `measure_geometry` Polygon, `create_single_share` con annotation, `create_swipe_share`) con la respuesta esperada al lado
- Nota sobre el formato SSE de las respuestas (`event: message\ndata: {...}`) y cómo extraer el JSON con `sed`.
- Mención al playground de `/administrador/documentacion` en mariachi-admin como alternativa visual.

Solo documentación. Cero cambios en código del MCP.

---

## [1.44.0] - 2026-05-25

### Agregado: 3 tools MCP para que agentes conversacionales entreguen mapas interactivos

Hasta 1.43.x el MCP de mapalab era exclusivamente de lectura — un agente LLM podía buscar capas y leer metadata pero no había forma de devolver un mapa interactivo al usuario, solo descripciones de texto.

Tres tools nuevos cierran esa brecha:

- **`create_single_share(layers, view?, basemap?, selected?, annotations?)`**: arma un envelope `kind='single'`, lo valida con `share_service.validate_payload`, lo persiste con `ShareRepository.upsert` y devuelve `{id, kind, url, embed_html}`. El `embed_html` es un snippet `<script>...</script><iieg-mapalab share="...">` listo para pegar en cualquier sitio. El agente lo embebe en su respuesta markdown (renderizable con `react-markdown`/equivalente) y el navegador del usuario monta el widget. Acepta `annotations` para pre-pintar geometrías resultado del análisis.
- **`create_swipe_share(pane_a_layers, pane_b_layers, position?, ...)`**: análogo pero `kind='swipe'` para comparación A|B. Ideal cuando el bot detecta preguntas comparativas ("antes vs después", "salud vs seguridad").
- **`measure_geometry(geometry)`**: recibe geometría GeoJSON EPSG:4326 y devuelve longitud (LineString) o área (Polygon/MultiPolygon) geodésica usando PostGIS `ST_Length`/`ST_Area` sobre `::geography`. Resultado en metros/m² reales sobre el elipsoide WGS84, no aproximaciones planas.

#### Implementación

- **`servers/share_tools.py`** (módulo nuevo): `create_single_share`, `create_swipe_share`, `measure_geometry` como funciones puras. Construyen `embed_html` con `MAPALAB_PUBLIC_BASE_URL` (env opcional, default `https://iieg.gob.mx`). Reusan `share_service.validate_payload` (mismo validador del endpoint REST) y `ShareRepository.upsert` (mismo hash determinístico — crear dos veces el mismo payload no duplica).
- **`servers/mapalab.py`**: 3 `@mcp.tool()` que delegan al módulo. Descripciones largas en español para que clientes MCP (Claude Desktop, IGIBot, etc.) las muestren legibles.

#### Pruebas e2e

```
POST /api/mcp/  tools/call create_single_share
  layers=["tasa_homicidio_doloso"], annotations=[polygon]
→ {id:"qd6fj67ex3", url:"https://iieg.gob.mx/mapalab/mapa?s=qd6fj67ex3",
   embed_html:"<script>...<iieg-mapalab share='qd6fj67ex3'>..."}

POST /api/mcp/  tools/call measure_geometry  Polygon ~10x10 km
→ {value:115374443.16, unit:"m²", value_km2:115.374443}
```

#### Caso de uso

IGIBot puede ahora:

```
1. usuario: "muéstrame los homicidios en Guadalajara"
2. bot: search_layers(q="homicidio") → "tasa_homicidio_doloso"
3. bot: create_single_share(layers=[...], view={zoom:11, lat:20.6, lon:-103.4})
4. bot: responde con texto + embed_html
5. usuario ve el mapa embebido, interactúa con él, activa medición (1.43.0+)
```

Sin breaking changes en tools existentes. Total: 14 tools (era 11).

#### Documentación

- **`docs/mcp.md`**: tabla de tools actualizada (11 → 14). Nueva sección "Entrega de mapas a agentes conversacionales" con firma de cada tool y patrón de uso end-to-end.

---

## [1.43.0] - 2026-05-25

### Agregado: mediciones y anotaciones se incluyen en el share (single + swipe)

Hasta 1.42.x los dibujos del visor (líneas/polígonos de medición, textos, emojis, freehand) eran efímeros — vivían en el `vectorSource` del `useMapDrawing` y se perdían al recargar o al copiar el link de "Compartir". Quien abría un share solo veía las capas, no las anotaciones.

Ahora el envelope del share acepta opcionalmente `payload.annotations: [...]` con cada medición serializada como GeoJSON en EPSG:4326. Al cargar el share, las anotaciones se restauran al vectorSource del `useMapDrawing` y se ven igual que cuando se dibujaron. Funciona para `kind='single'` y `kind='swipe'` — las anotaciones son globales del mapa, no por pane (decisión alineada con `docs/swipe.md §Pendientes`).

#### Backend

- **`backend/app/services/share_service.py`**: `MAX_PAYLOAD_BYTES` sube a 256 KB (los polígonos reales no caben en 64 KB). Nuevo `_validate_annotations(payload.annotations)`: lista ≤ 200 items, cada uno con `id`, `type ∈ {LineString, Polygon, Freehand, Text, Emoji}`, `geometry` GeoJSON básico (`type ∈ {Point, LineString, Polygon, MultiPolygon}`, `coordinates ≤ 2000 puntos`), `rotation` numérico opcional. `_validate_single_payload` y `_validate_swipe_payload` lo invocan.
- **`backend/test/test_share_service.py`**: 9 tests nuevos para annotations (single y swipe, geometría inválida, type inválido, sin id, límite de 200, None y campo ausente). Total: 21 tests.

#### Frontend serializer / deserializer

- **`useShareSerializer.js`**: nuevo helper `serializeAnnotations(measurements)` que itera `measurements`, ignora items sin `feature` o de tipo `Select`, y convierte cada `feature.getGeometry()` a GeoJSON con `featureProjection:'EPSG:3857' → dataProjection:'EPSG:4326'`. Preserva `id`, `type`, `label`, `value`, `textLabel`, `rotation`, `visible`. Se invoca cuando `extra.includeAnnotations === true` (default `false`).
- **`useShareDeserializer.js`**: si `payload.annotations` existe, llama `restoreAnnotations(payload.annotations)` (expuesto por `useMapDrawing` vía `MapsProvider`). Lo hace tanto en la rama `single` como en la `swipe`.
- **`useMapDrawing.js`**: nuevo `restoreAnnotations(annotations)`. Reconstruye `ol.Feature` desde GeoJSON, recalcula `formatLength`/`formatArea` desde la geometría (no confía en el `value` recibido, defensa contra geometrías editadas externamente), setea `textLabel`/`rotation`/`annotationType` para Text/Emoji/Freehand, agrega al `vectorSource` y empuja al state `measurements`. Retry-polling de 100 ms hasta 5 s mientras `ensureVectorLayer()` falle — necesario porque los shares se aplican antes de que el mapa termine de montar.

#### UX

- **`ShareModal.jsx`**: si `measurements` tiene al menos 1 item con `feature` y `type !== 'Select'`, aparece un checkbox **"Incluir mis mediciones y anotaciones (N)"** marcado por default. El conteo es en vivo. El texto explica que quien abra el enlace verá las líneas, polígonos, textos y emojis dibujados.

#### Documentación

- **`docs/swipe.md`**: nueva sección "Annotations (mediciones persistidas en el share)". `payload.annotations` documentado en §Persistencia. Tabla de pendientes ajustada: "dibujar mediciones nuevas en swipe" sigue pendiente, pero las pre-existentes vía share ya se ven.

---

## [1.42.1] - 2026-05-25

### Corregido: backend de `shares` aceptaba `kind='compare'` (legacy) pero rechazaba `kind='swipe'` (actual)

`docs/swipe.md` afirmaba desde hace meses que "Compartir ✅ Envelope `kind: 'swipe'` con ambos snapshots", pero el backend tenía el modelo viejo con `kind IN ('single','compare')` y `_validate_compare_payload` (con `axis ∈ {date,filter,geo}` y `panes` con `value`). El botón "Compartir" del visor en modo swipe enviaba `kind='swipe'` y recibía `HTTP 400 {"detail":"kind invalido: swipe"}` silenciosamente — feature roto en producción.

El frontend (`useShareSerializer`, `useShareDeserializer`) ya manejaba `single | swipe` exclusivamente (sin fallback legacy). El backend se actualiza para alinearse con el contrato real documentado.

- **`backend/app/services/share_service.py`**: `ALLOWED_KINDS = {'single', 'swipe'}`. Nuevo `_validate_swipe_payload` que valida el shape documentado en `docs/swipe.md §Persistencia` (`shared.view`, `paneA.layers`, `paneB.layers`, `activeSlot ∈ {A,B}`, `position ∈ [0,1]`). Extraído `_validate_view` y `_validate_layer_entries` para reusar entre single/swipe. `_validate_compare_payload` removido.
- **`backend/app/models/share.py`**: `CheckConstraint("kind IN ('single','swipe')")`.
- **Migración Alembic en dataengine** `0013_map_shares_kind_swipe`: drop CHECK viejo, `DELETE FROM mapalab.map_shares WHERE kind='compare'` (solo afecta filas no alcanzables desde la UI actual), nuevo CHECK con `('single','swipe')`. Downgrade reversible.
- **`backend/test/test_share_service.py`**: 12 tests cubriendo single/swipe válidos, validaciones de cada campo, rechazo explícito de `compare` legacy.

Verificación end-to-end: `POST /api/shares` con `kind='swipe'` y el payload exacto que arma el serializer del visor devuelve `200 OK` con el `id` del share. El widget `<iieg-mapalab share="...">` ahora puede cargar swipes guardados.

---

## [1.41.0] - 2026-05-22

### Agregado: iconText soporta texto visible separado del campo URL + auto-href en icono `web`

El bloque `iconText` del InfoBox aceptaba `field` (valor a mostrar) y opcionalmente `href` (link literal). Faltaban dos cosas: poder mostrar un texto distinto al valor del campo (ej. "Sitio oficial" en vez de la URL larga del feature), y que el icono `web` resolviera automáticamente el link cuando el `field` apunta a una columna con la URL.

#### Qué cambió

- **`frontend/src/pages/maps/components/InfoBox/components/IconText.jsx`**: nueva prop `hrefValue` (defaults a `value`). `buildHref` ahora maneja `web` además de `celular`/`ubicacion`: si el valor parece URL absoluta la usa tal cual; si no, le antepone `https://`.
- **`frontend/src/pages/maps/components/InfoBox/utils/renderCard.jsx`**: `renderIconText` ahora computa `displayValue = item.label || item.value || properties[item.field]` (label gana sobre el valor del campo) y pasa `hrefValue = properties[item.field] || item.value || displayValue` para que `buildHref` use la fuente correcta. Cuando hay `item.href` explícito se resuelve con `resolveHref` (soporta tokens `{campo}`, mismo helper que `text`/`list`).

#### Ejemplos

- **Antes**: `{icon: 'web', field: 'sitio_web'}` mostraba la URL completa como texto, no clickeable.
- **Ahora**: `{icon: 'web', field: 'sitio_web', label: 'Sitio oficial'}` muestra "Sitio oficial" subrayado, link abre `properties.sitio_web` en pestaña nueva.
- **Token explícito**: `{icon: 'web', label: 'Catastro', href: 'https://catastro.gob.mx/{clave_catastral}'}` resuelve el token contra el feature.

Backward compat: items existentes sin `label` o `href` siguen comportándose igual (el icono `web` ahora también genera link auto, antes no lo hacía sin `href` explícito — diferencia leve pero deseada).

---

## [1.40.2] - 2026-05-22

### Corregido: menús flotantes con `bottom-start`/`bottom-end` no se adaptaban al viewport

`useSiderMenuPosition` ya calculaba `maxHeight` cuando el menú no cabía hacia la derecha (`right-start`), pero las variantes `bottom-start` y `bottom-end` retornaban `maxHeight: null` sin importar cuánto contenido tuvieran. Como el `Panel` con `variant="menu"` aplica `overflow-hidden` al contenedor, el contenido del menú se clipeaba cuando rebasaba el alto del viewport.

El único consumidor con `bottom-start` en modo `variant="menu"` era el botón flotante de eventos (`ExternalEventoWidget`), así que en eventos con muchas capas el panel se cortaba al final sin scroll.

#### Qué cambió

- **`frontend/src/hooks/useSiderMenuPosition.js`**: `bottom-start` y `bottom-end` calculan `availableHeight = window.innerHeight - top - 16` y pasan ese valor como `maxHeight` cuando `contentHeight` lo rebasa; si no, `null`. `ThemeMenu` ya envuelve el listado en `ScrollContainer` con `flex-1 overflow-y-auto`, así que el scroll interno se activa solo cuando el menú queda clampeado.

### Cambiado: eventos pausados en el panel del sider

Los eventos venían apareciendo en dos lugares: dentro del sider (entre capas base y temas) y en el widget flotante a la derecha del sider. Se elimina la entrada del sider — los eventos ahora solo se acceden desde el widget flotante.

Para restaurar la versión anterior basta con poner `SIDER_EVENTS_ENABLED = true` en `MapSider.jsx`.

#### Qué cambió

- **`frontend/src/pages/maps/components/MapSider.jsx`**: nuevo flag `SIDER_EVENTS_ENABLED` (default `false`) y `EMPTY_EVENTOS` (frozen array a nivel módulo para conservar la referencia estable en `useMemo`). `eventosForSider` se usa tanto para `createMenuItems` como para `eventCount`; el widget flotante (`ExternalEventoWidget`) sigue recibiendo el array completo desde `EventoContext`.

---

## [1.40.1] - 2026-05-22

### Corregido: tools MCP `get_metadata`, `resolve_layer_ref` y `get_periodicity` aceptan `Layer.id` del visor

El contrato entre tools era inconsistente: `search_layers` devuelve `id` con el formato del visor (p. ej. `tasa_homicidio_doloso`), pero los otros tools esperaban distintos identificadores derivados (geoserver_layer, slug/alias, schema en PostGIS). Un agente que encadenaba `search_layers → get_metadata` con el `id` recibido recibía `[]`; `resolve_layer_ref` siempre devolvía 404 porque `Layer.slug` y `LayerAlias` no están poblados; `get_periodicity` con el alias del workspace devolvía `null` porque la `layer_key` real usa el `db_schema` completo (`seguridad_y_proteccion_ciudadana`, no `seguridad`).

Los tres tools ahora resuelven el identificador antes de consultar, manteniendo compatibilidad si ya se pasaba el valor exacto.

- **`backend/app/services/layer_metadata_service.py`**: `_resolve_layer_key` extraído a `_resolve_workspace_name` + lookup en `mapalab.layers` por `(workspace_alias, id)`. Si la fila existe usa `Layer.geoserver_layer`, si no deja el `layer` tal cual recibido.
- **`backend/app/services/periodicity_service.py`**: nuevo `_resolve_layer_key` análogo (alias → `db_schema`, `Layer.id` → `geoserver_layer`). `get_periodicity` y `get_periodicities_batch` ahora lo invocan antes de consultar `public.layer_periodicity`; el batch deduplica las keys resueltas.
- **`backend/app/repositories/layers_repository.py`**: `find_layer_by_slug_or_alias` agrega fallback final `Layer.id == ref` para el caso esperable donde slug/alias no están poblados.
- **`docs/mcp.md`**: sección nueva "Identificadores aceptados" con la tabla del contrato.

Sin cambios de schema. Reutilizable desde REST también: los tres endpoints REST (`/metadata/`, `/layers/resolve`, `/periodicity/`) heredan la robustez al pasar por los mismos servicios.

---

## [1.38.3] - 2026-05-22

### Corregido: InfoBox quedaba debajo de los overlays del mapa con `z-0`

En `1.38.2` bajamos el InfoBox a `z-0`. Eso lo dejaba al mismo nivel que los overlays DOM del mapa (texto/emojis del editor en mapa, markers, anotaciones — `ol/Overlay` arranca con z-index `0`), así que dependiendo del orden del DOM el InfoBox podía quedar detrás de ellos. Lo subimos a `z-5`: queda por encima de los overlays del mapa y de `SwipeView` (`z-1`), y sigue por debajo de cualquier panel UI (`z-10` en adelante).

#### Qué cambió

- **`frontend/src/pages/maps/components/InfoBox/InfoBox.jsx`**: contenedor desktop pasa de `z-0` a `z-5`.
- **`docs/z-index.md`**: tabla y diagrama reflejan el nuevo nivel.

---

## [1.38.2] - 2026-05-22

### Corregido: InfoBox se anteponía a Capas Activas, MapSider y otros paneles

El `InfoBox` (panel flotante anclado a un feature del mapa) usaba `z-50`, el carril que el resto del proyecto reserva para modales (`Modal`, `MobileSheet`, `ConfirmDropdown`, `DownloadMenu`). Como no es un modal sino un overlay anclado al mapa, se colaba sobre paneles legítimos: lista de capas activas (`z-10`), `MapSider` (`z-20`), e incluso sobre el `LayerDetailModal` (que originalmente estaba en `z-30`).

En `1.37.3` lo habíamos resuelto subiendo el modal a `z-60`, pero el problema raíz era el InfoBox. Bajamos el InfoBox a `z-0` (sigue sobre el canvas del mapa, debajo de cualquier panel UI) y devolvemos el `LayerDetailModal` a su `z-30` original.

#### Qué cambió

- **`frontend/src/pages/maps/components/InfoBox/InfoBox.jsx`**: contenedor desktop pasa de `z-50` a `z-0`. El `MobileSheet` (variante mobile) mantiene su `z-50` propio porque ahí sí actúa como sheet modal.
- **`frontend/src/pages/maps/components/LayerDetailModal/LayerDetailModal.jsx`**: contenedor vuelve de `z-60` a `z-30`.
- **`docs/z-index.md`**: tabla y diagrama reflejan el nuevo orden (InfoBox al fondo del stack UI, modal en `z-30`).

---

## [1.38.0] - 2026-05-22

### Agregado: respeto del campo `z` por capa del evento + revert de iteración inversa

El editor de eventos en mariachi (`1.14.0`) ahora expone un campo `z` opcional por capa que define el orden Z explícito del mapa, desacoplado del orden visual del submenú. El visor lo consume al auto-activar las capas del evento.

#### Qué cambió

- **`frontend/src/pages/maps/components/EventoMenu.jsx`**: revertida la iteración inversa de `toActivate` que metí en `1.36.0` (asumía "primera fila del editor = al frente del mapa"). Ahora cada item se enriquece con `z` (`typeof c.z === 'number' ? c.z : null`), se ordena `toActivate` por `z` **ascendente** (`null` primero, luego z asc), y se procesa con `forEach` normal. Como `handleToggleLayer` hace unshift, las que se procesan más tarde quedan al frente: las con mayor Z terminan al inicio de `activeLayerIds` (= al frente del mapa) y las sin Z quedan al final (= al fondo).

#### Convención resultante (alineada con mariachi `1.14.0`)

| Caso | Z del mapa |
|---|---|
| Todas las capas sin `z` | Última fila del editor al frente, primera al fondo (comportamiento original anterior al fix erróneo de 1.36.0) |
| Una capa con `z=5`, el resto sin `z` | La de Z=5 al frente; las demás en su orden de tabla detrás |
| `A z=1`, `B z=3`, `C z=2` | B (Z=3) al frente, C (Z=2), A (Z=1) al fondo |
| Mezcla: `A` sin Z, `B z=2`, `C` sin Z | B al frente; A y C entre sí por posición de tabla |

Sort estable (`Array.prototype.sort` en V8/Node 12+) garantiza que dos capas con mismo `z` (o ambas sin `z`) preservan el orden del `walk(evento.capas)`.

Sin cambios en el cache, schema o endpoints. Eventos viejos sin `z` se comportan como antes del fix de 1.36.0.

---

## [1.37.3] - 2026-05-22

### Corregido: modal de detalle de capa queda debajo del InfoBox

El `LayerDetailModal` se renderizaba con `z-30`, mientras que el `InfoBox` (panel flotante de información de features) usa `z-50`. Cuando ambos estaban abiertos, el InfoBox tapaba parte del modal. Subimos el modal a `z-60` para que quede por encima del InfoBox; el InfoBox sigue funcionando igual sobre el resto de paneles del visor.

#### Que cambio

- **`frontend/src/pages/maps/components/LayerDetailModal/LayerDetailModal.jsx`**: contenedor pasa de `z-30` a `z-60`.
- **`docs/z-index.md`**: tabla y diagrama actualizados con el nuevo orden (LayerDetailModal `[60]` arriba de FeatureInfoPanel `[50]`).

---

## [1.37.2] - 2026-05-22

### Corregido: flechas y degradado del `ScrollContainer` en el panel de Capas Activas

Cuando un item del panel "Capas Activas" se selecciona, se vuelve `position: sticky` (vía `[data-sticky]` en `SortableList`) y crece con periodicidad, barra de acciones y leyenda (`GetLegendGraphic`, que además carga asíncrona). Antes el `ScrollContainer` usaba una constante `STICKY_SIZE = 52` (100 en mobile) para posicionar las flechas "ir al inicio / al final" y el degradado superior/inferior. El item expandido medía mucho más que 52 px, así que las flechas y el degradado caían **dentro** del item sticky: ocultos detrás de la leyenda y sin poder clickearse.

Ahora `useScrollOverflow` mide la altura real del elemento `[data-sticky]` con `getBoundingClientRect` y le monta un `ResizeObserver` dedicado para captar el crecimiento asíncrono cuando carga la imagen de la leyenda. El nuevo campo `stickyHeight` se propaga a `ScrollContainer`, que lo prefiere sobre la prop `stickySize` (que queda como fallback opcional).

#### Que cambio

- **`frontend/src/hooks/useScrollOverflow.js`**: nuevo `stickyHeight` en el estado, calculado desde `getBoundingClientRect` del `[data-sticky]`. `ResizeObserver` dedicado al sticky que se conecta/desconecta automáticamente cuando aparece o cambia.
- **`frontend/src/components/ScrollContainer.jsx`**: `topOffset` / `bottomOffset` usan `stickyHeight || stickySize`. Sin cambios para consumidores sin `[data-sticky]` interno.
- **`frontend/src/pages/maps/components/ActiveLayers/ActiveLayersList.jsx`**: removido el hardcode `STICKY_SIZE = 52` / `STICKY_SIZE_MOBILE = 100` y la prop `stickySize` que se pasaba al `ScrollContainer`. También se quitó el `useSider`/`isMobile` que ya no se usaba.

---

## [1.37.1] - 2026-05-22

### Cambiado: ocultar contador `1/1` en el header del InfoBox

Cuando una capa devuelve un único feature, el badge `1/1` ya no se renderiza en el header de la tarjeta (ni desktop ni mobile). La condición pasó de `total > 0` a `total > 1` en ambos headers. El layout no cambia: en desktop el badge está en `position: absolute` con el padding lateral (`px-12`) reservado, así que el título sigue centrado idéntico; en mobile el badge vive en un flex con el título en `flex-1`, así que al ocultarse el título solo absorbe el espacio liberado.

#### Que cambio

- **`frontend/src/pages/maps/components/InfoBox/components/Header.jsx`**: `showBadge` ahora exige `total > 1`.
- **`frontend/src/pages/maps/components/InfoBox/components/MobileFeatureHeader.jsx`**: misma condición.

---

## [1.37.0] - 2026-05-22

### Agregado: links clicables en InfoBox + múltiples bloques de texto por template

Dos extensiones al sistema de templates de InfoBox:

#### Hrefs en filas de lista y bloques de texto

`<List>` y `<Text>` aceptan ahora una prop `href` que renderiza el valor como `<a target="_blank" rel="noopener noreferrer">` con underline morado (`text-[#5C2472]`). Si `href` no se pasa, el valor sigue siendo texto plano.

En la configuración del template, cada `list[]` y cada item de `text[]` acepta un campo `href` con plantilla. La plantilla soporta tokens `{nombre_campo}` que `resolveHref` (en `infoBoxTextBlocks.js`) reemplaza por el valor del feature (URL-encoded). Si algún token queda sin resolver, el href se descarta y el valor se renderiza como texto. Solo se permiten hrefs con scheme `http:`, `https:`, `mailto:`, `tel:` o rutas absolutas (`/...`) — todo lo demás se descarta.

#### Múltiples bloques de texto independientes

Antes el template tenía un único `text: [...]` que se renderizaba como un bloque contiguo. Ahora `finalConfig.text` es un array de bloques con `{ id, items: [...] }`, lo que permite intercalar varios bloques de texto entre `labels`, `list`, `cards`, etc. via `blockOrder` usando claves `text:<id>`.

Se preserva retrocompatibilidad: `normalizeFinalConfig` detecta la forma legacy (`text: [{ label, value, field, ... }]` sin `items`) y la convierte a `text: [{ id: 't0', items: [...] }]`. Si el `blockOrder` legacy menciona `'text'`, se reescribe como `'text:t0'`. Templates existentes funcionan sin cambios.

#### Que cambio

- **`frontend/src/pages/maps/components/InfoBox/components/List.jsx`**: cada fila resuelve `href`; si existe, el valor formateado se envuelve en `<a>` con underline.
- **`frontend/src/pages/maps/components/InfoBox/components/Text.jsx`**: nueva prop `href`; mismo patrón de `<a>` cuando se pasa.
- **`frontend/src/pages/maps/components/InfoBox/utils/renderCard.jsx`**: `renderList` recibe `getValue` y resuelve `row.href`. `renderText` reemplazado por `renderTextBlock` (itera `block.items`). `resolveBodyOrder` expande la clave genérica `'text'` en N claves `'text:<id>'`, una por bloque presente, conservando la posición relativa. `renderCard` invoca `normalizeFinalConfig` al recibir el config.
- **`frontend/src/pages/maps/components/InfoBox/utils/infoBoxTextBlocks.js`** (nuevo): helpers `isTextKey` / `textIdOf` / `mkTextKey` para la clave compuesta; `resolveHref` con allowlist de schemes y reemplazo de tokens; `normalizeFinalConfig` para migrar configs legacy.

---

## [1.36.0] - 2026-05-22

### Cambiado: barra de acciones de eventos en producción + botón "Centrar evento"

`<EventoActionsBar>` ya no está gated por `IS_NON_PROD` — se renderiza siempre. En `dev`/`beta` mantiene el border `border-orange` + badge "beta"; en producción usa fondo neutro (`bg-[#F9FBFF]`) sin badge. El único elemento que sigue gated es el botón Colibri (`<ReportButton>` de "Reportar problema con este evento"), envuelto con `IS_NON_PROD && (...)` para que no se renderice ni ocupe espacio en producción.

Reemplazamos el botón de copiar enlace del evento por un botón "Centrar evento" (icono `fit_extent`). Llama al mismo `centerOnEvento` que dispara el primer mount del menú (bbox-fit con padding 8% del shortSide), por lo que el usuario puede recuperar el encuadre en cualquier momento aunque haya hecho pan/zoom. Solo se renderiza si `evento.bbox` está definido. Emite telemetría `evento_center` con `evento_id`. Eliminamos junto con esto el helper `buildEventoShareUrl`, sus 5 tests y el tracker `evento_share`.

### Cambiado: `EventoMenu` respeta el estado previo al re-abrir

Tanto el bbox-fit como el auto-activado de capas con `autoActivar !== false` ahora hacen skip al primer mount si ya existe al menos una capa del evento en `activeLayerIds`. Antes, cada cierre/apertura del menú desmontaba/montaba el componente, los `useRef` se reseteaban y volvía a re-encuadrar el mapa y a re-activar las capas que el usuario había apagado manualmente. Ahora:

- Primera apertura del evento (o tras apagar todas sus capas) → centra el mapa y activa las capas con `autoActivar !== false`.
- Reapertura con al menos una capa del evento ya activa → no se mueve el mapa ni se reactiva ninguna capa. El usuario puede recentrar manualmente con el botón "Centrar evento".

#### Que cambio (ambas secciones)

- **`frontend/src/pages/maps/components/EventoMenu.jsx`**: `centerOnEvento` extraído a `useCallback` y pasado a `<EventoActionsBar>` como `onCenterEvento`. Los dos efectos (bbox-fit y autoactivado) cortocircuitan cuando `eventoLayerIds` interseca `activeLayerIds`.
- **`frontend/src/pages/maps/components/EventoActionsBar.jsx`**: eliminado el early return `IS_NON_PROD`; eliminado el botón Compartir con su estado `copied`/timers; agregado botón "Centrar evento" con `Icon name="fit_extent"`; `<ReportButton>` envuelto con `IS_NON_PROD && (...)`; container con clases distintas por entorno.
- **`frontend/src/services/analyticsService.js`**: agregado `trackEventoCenter(eventoId)`; eliminado `trackEventoShare`.
- **`frontend/src/pages/maps/helpers/eventoHelpers.js`**: eliminado `buildEventoShareUrl` (sin uso).
- **`frontend/src/test/pages/maps/helpers/eventoHelpers.test.js`**: eliminados los 5 tests de `buildEventoShareUrl` y su import.
- **`docs/context.md`**: actualizado el bloque de `<EventoMenu>` / `<EventoActionsBar>`; agregado `evento_center` a la lista de eventos analytics; eliminada referencia a `buildEventoShareUrl` en helpers compartidos.
- **`docs/analytics.md`**: agregada fila para `evento_center`.

---

### Corregido: orden Z de capas auto-activadas del evento

Al abrir un evento, la primera capa del submenú (definida en mariachi `CapasField`) terminaba al final de `activeLayerIds` por el comportamiento de unshift de `handleToggleLayer` combinado con `forEach` en orden directo. Resultado: el orden Z del mapa quedaba invertido respecto al orden visual del submenú y del editor en mariachi, obligando a cada usuario a reordenar manualmente desde el panel de Capas Activas.

#### Que cambio

- **`frontend/src/pages/maps/components/EventoMenu.jsx`**: iteración inversa de `toActivate` en la auto-activación (`for` de `length-1` a `0`). Cada `onToggleLayer` sigue haciendo unshift, pero al procesar las capas en orden inverso, la primera del submenú termina en el índice 0 de `activeLayerIds` — al frente del mapa.

#### Convención resultante

| Posición en submenú/editor mariachi | Panel Capas Activas | Z del mapa |
|---|---|---|
| Arriba | Arriba | Al frente |
| Abajo | Abajo | Al fondo |

Para mandar una capa al fondo: en mariachi se arrastra al final del CapasField. Sin cambios en el panel de Capas Activas (ya soporta drag & drop genérico para reordenar después).

Solo afecta la auto-activación inicial. Activar manualmente una capa desde el submenú sigue trayendo la capa al frente (comportamiento estándar de `handleToggleLayer`).

---

## [1.35.1] - 2026-05-22

### Cambiado: path del MCP sin slash final para alinear con iieg-oficial/agent

Los 9 servers MCP de `iieg-oficial/agent` (sql, analytics, charts, rag, files, utils, summary, tavily, vision) montan todos con `http_app(path="/mcp", stateless_http=True)` — sin slash final. La 1.35.0 de mapalab uso slash (`path='/mcp/'`) porque era la forma mas directa de evitar el 307 redirect cuando nginx pegaba con slash al backend. Esto generaba ruido al integrar mapalab en IGIBot, donde todos los demas MCP servers usan sin slash.

#### Que cambio

- **`servers/mapalab.py`**: `mcp.http_app(path='/mcp', stateless_http=True)` (sin slash).
- **`nginx/nginx.conf`**: dos `location =` exactos (sin slash y con slash) que pegan ambos al backend en `/mcp` sin slash:
  ```nginx
  location = /api/mcp       { proxy_pass http://mapalab_mcp/mcp; ... }
  location = /api/mcp/      { proxy_pass http://mapalab_mcp/mcp; ... }
  location = /mapalab/api/mcp  { proxy_pass http://mapalab_mcp/mcp; ... }
  location = /mapalab/api/mcp/ { proxy_pass http://mapalab_mcp/mcp; ... }
  ```
- **`docs/mcp.md`** + **playground en mariachi-admin**: URL canonica `/api/mcp` (sin slash). La forma con slash sigue funcionando por compatibilidad con clientes que ya la usaban.

Sin cambios en el contrato de tools, telemetria, dashboard ni alertas.

---

## [1.35.0] - 2026-05-21

### Cambiado: servidor MCP movido a un container dedicado `mapalab-mcp`

Alineado con el patron de los servers MCP del ecosistema `agent` (IGIBot):
FastMCP con tools manuales (`@mcp.tool()`) + docstrings como descripcion,
`combined_app` con `health` y `/mcp/`, transporte `stateless_http=True`.

#### Por que

El MCP vivia embebido en el backend principal. Eso mezcla un servicio sin
estado (lectura del catalogo) con el backend monolitico que tiene scheduler,
embed proxy, downloads, etc. Sacarlo a un container propio permite:

- Escalar el MCP independientemente del backend (mas workers para el agente
  sin tocar el visor).
- Coherencia con `iieg-oficial/agent/servers/*.py` — un agente que ya consume
  `sql-agent`, `búsqueda-web`, etc. ve a mapalab como un servidor mas.
- Telemetria y metricas aisladas (etiqueta `service=mcp` separada de
  `service=backend` en Prometheus).

#### Que cambio

- **Nuevo: `servers/mapalab.py`** — FastMCP con 11 tools manuales decorados
  con `@mcp.tool()`. Reutiliza los servicios y repositorios existentes del
  backend (`app.services.*`, `app.repositories.*`) — cero duplicacion de
  logica de DB.
- **Nuevo: `servers/telemetry.py`** — middleware ASGI + flush loop +
  `flush_pending_sync()` para shutdown. El middleware ahora se aplica a la
  app combinada con filtro de path (`path_prefix='/mcp'`) en vez de a
  `mcp_app` directamente (que no se preservaba al combinar routes).
- **Nuevo: `servers/Dockerfile`** — base compartida con el backend
  (`backend/requirements.txt`) + el codigo de `backend/app` + `servers/`.
  Targets `development` (con `--reload`) y `production` (gunicorn 2 workers).
- **Nuevo service `mapalab-mcp` en `docker-compose.yml`** — pool de DB
  configurable via `MCP_DB_POOL_SIZE` / `MCP_DB_MAX_OVERFLOW` (default 2+2
  para minimizar conexiones). Compartido en `iieg-network`. Healthcheck
  contra `/health`.
- **`nginx/nginx.conf`** — upstream nuevo `mapalab_mcp`. Las dos locations
  `/mapalab/api/mcp/` y `/api/mcp/` apuntan ahora a `http://mapalab_mcp/mcp/`
  en vez de al backend.
- **`backend/app/server.py`** — limpiado: ya no importa `fastmcp`, no monta
  `/mcp`, no corre el flush loop del MCP. Lifespan reducido. El backend
  vuelve a ser solo REST + scheduler + embed.
- **Eliminado**: `backend/app/middleware/mcp_telemetry.py`,
  `backend/app/services/mcp_telemetry.py`. Su contenido vive ahora en
  `servers/telemetry.py`.

#### Tools expuestos (11)

`search_layers`, `resolve_layer_ref`, `get_layer_tree`, `get_initial_order`,
`get_workspaces`, `get_metadata`, `get_sources_batch`, `get_periodicity`,
`get_periodicities_batch`, `refresh_layer_tree_cache`,
`invalidate_layer_tree_memory_cache`.

`shares` y sus 5 tools (write) ya no se exponen al MCP — quedan disponibles
en REST si un cliente HTTP los necesita.

#### Observabilidad

- **Prometheus** — nuevo target en `huachicol/prometheus/targets/projects.json`
  con label `service=mcp project=mapalab`. La variable `MAPALAB_MCP_TARGET`
  se agrega a `huachicol/.env` y al script `generate-targets.sh`. Las
  metricas `mapalab_mcp_calls_total` y `mapalab_mcp_latency_ms` siguen
  iguales — solo cambia el job de origen.
- **Mariachi** — el endpoint interno `/api/administrador/internal/mapalab/mcp/events`
  y la tabla `mapalab_mcp_events` no cambian. El flush_loop ahora vive en
  el lifespan del MCP server.

#### Notas de migracion

- **Path con slash final**: `mcp.http_app(path='/mcp/')` (con slash) para
  evitar el 307 redirect que FastMCP emite cuando el cliente pide
  `/mcp/` y el mount es `/mcp` (sin slash).
- **Middleware location**: aplicar `MCPTelemetryMiddleware` al `mcp_app`
  antes de combinar routes NO funciona — los middlewares de Starlette no
  se preservan al hacer `routes=[*mcp_app.routes]`. Se aplica a la
  `combined_app` con `path_prefix='/mcp'`.
- **Pool de DB**: el MCP server abre su propio pool de SQLAlchemy. Default
  `pool_size=2, max_overflow=2` (4 conexiones max por worker, 8 totales
  con 2 workers de gunicorn). Se suma al pool del backend (8+8 = 16 por
  worker, 128 con 8 workers).

---

## [1.34.0] - 2026-05-21

### Agregado: descripciones, telemetría y dashboard del servidor MCP

- **Descripciones legibles para los 17 tools del MCP**. Cada endpoint expuesto al MCP (`metadata`, `periodicity`, `layers`, `shares`) ahora declara `operation_id`, `summary` y `description` en su decorador FastAPI. Los tools pasan de nombres largos heredados del routing (`get_layer_tree_layers_tree_get`) a nombres cortos (`get_layer_tree`) y cada uno trae descripción larga en español que orienta al LLM. Énfasis especial en `search_layers`, que documenta explícitamente que devuelve label + path jerárquico para que un agente pueda resolver el ID de una capa a partir del nombre que conoce el usuario.

- **Telemetría del MCP → mariachi**. Cada request HTTP al `/mcp/` pasa por un middleware ASGI puro (`backend/app/middleware/mcp_telemetry.py`) que parsea el JSON-RPC, mide duración + bytes de salida y bufferea el evento. Un loop async flushea cada 30 s a un endpoint interno nuevo en mariachi (`POST /api/administrador/internal/mapalab/mcp/events` con `X-Internal-Token`), mismo patrón que `access_logger` y `api_key_quota`.
  - **Campos**: `timestamp`, `dia`, `method`, `tool`, `status`, `error_code`, `duration_ms`, `bytes_out`, `session_hash`, `ip_hash`, `client_name`, `client_version`.
  - **Sin identidad**: `session_id` e IP del cliente se persisten como SHA-256 salteado por `MAPALAB_INTERNAL_TOKEN`. No hay ni IP en claro ni session id en claro.
  - **Middleware ASGI puro** (no `BaseHTTPMiddleware`) para no consumir el stream SSE del transport HTTP streamable.

- **Métricas Prometheus paralelas**:
  - `mapalab_mcp_calls_total{method, tool, status}` — counter por llamada.
  - `mapalab_mcp_latency_ms{tool}` — histograma de duración solo para `tools/call`.
  - Dos alertas nuevas en huachicol: `MapalabMcpHighErrorRate` (>10 % de 4xx/5xx en 10 min con tráfico sostenido) y `MapalabMcpHighLatency` (p95 > 5 s).

- **Panel de admin nuevo**: tab "MCP" dentro de `/administrador/mapalab/stats`. 4 vistas materializadas (`mapalab_mcp_stats_overview`, `mapalab_mcp_stats_tools`, `mapalab_mcp_stats_daily`, `mapalab_mcp_stats_clients`) alimentan tarjetas (llamadas 30d/7d/hoy, tasa de error, latencia media), gráfica de llamadas por día con stack de errores, tabla por tool (usos, errores, p95) y tabla de clientes MCP (Claude Desktop, IGIBot, otros). Se refrescan con el botón "Refrescar vistas" del tab Resumen — ya existían las del visor y se sumaron las del MCP a la misma lista.

- **Página de Documentación en mariachi-admin** (`/administrador/documentacion`): hub para guías técnicas con tabs verticales por tema; el primer tema es "Servidor MCP" con qué es, cómo usarlo (Claude Desktop + Python), tabla de los 17 tools agrupados por router, ejemplo de respuesta de `search_layers`, descripción de los campos persistidos en `mapalab_mcp_events` y un playground interactivo que llama los endpoints REST equivalentes y muestra HTTP status + latencia + JSON con copy-to-clipboard de la URL. El item del sider queda anclado al footer con `position: absolute; bottom: 0` para que sea siempre visible.

#### Migraciones de datos

- `mariachi/api/alembic/versions/mariachi/b9c0d1e2f3a5_add_mapalab_mcp_events.py` — tabla `mapalab_mcp_events` con 4 índices.
- `mariachi/api/alembic/versions/mariachi/c0d1e2f3a4b6_add_mapalab_mcp_stats_views.py` — 4 vistas materializadas con índices únicos para refresh CONCURRENTLY.

---

## [1.33.1] - 2026-05-21

### Fix: basemap del evento se revertía al hacer click en el mapa

Cuando un evento tenía `basemapId` configurado (1.32.0), el visor aplicaba el basemap al abrir el menú lateral del evento — correcto — pero al hacer click en cualquier parte del mapa el basemap se revertía al default ("voyager"). El usuario tenía que volver a abrir el menú para verlo, y se revertía otra vez al siguiente click.

#### Causa

El effect que aplicaba el basemap vivía en `frontend/src/pages/maps/components/EventoMenu.jsx`. Ese componente se renderiza dentro de `<Panel open={isMenuOpen}>` y el Panel hace `if (!open) return null` cuando se cierra. El Panel se cierra automáticamente al click fuera (handler `mousedown` document-level, comportamiento esperado de un menú). Al desmontarse `EventoMenu`, el cleanup del effect llamaba `setBaseMapId(previous)` restaurando el basemap previo — el usuario percibía esto como "el basemap se revierte al click".

La intención original del cleanup era restaurar el basemap "al cerrar el evento", pero el ciclo de vida del componente está atado a "abrir/cerrar el menú lateral", no a "evento activo". El click en el mapa cierra el menú pero el evento conceptualmente sigue activo (capas prendidas, banner visible).

#### Fix

- **`frontend/src/pages/maps/components/EventoMenu.jsx`**: se elimina el cleanup del effect del basemap. El effect ahora solo aplica `setBaseMapId(evento.basemapId)` al montar / cambiar de evento. El restore-al-cerrar se pierde — si el usuario quiere otro basemap, lo cambia desde el picker de basemaps. Eliminados `previousBasemapRef`, el effect de sincronización de `baseMapIdRef`, y `baseMapId` del destructure de `useMapsContext` (ya no se usaba).

#### Nota

El restore-al-cerrar "real" requiere mover el effect del basemap a `EventoProvider` (donde vive `activeEvento`) y limpiar `activeEvento` sólo cuando el evento deja de estar activo (capas apagadas o se abre otro evento). Queda como follow-up si lo piden.

---

## [1.33.0] - 2026-05-21

### Avisos y dato curioso: italic visible, popover de fact sin símbolo, render inline centralizado

Tres fixes pequeños sobre la integración del texto enriquecido del visor con la salida del editor de mariachi 1.9.0.

#### Corregido

- **Italic invisible en avisos y datos curiosos**. La fuente custom `Garet` (`frontend/src/index.css`) carga todas sus variantes con `font-style: normal` (Book, Regular, Medium, Bold, ExtraBold), y la regla global tiene `font-synthesis: none`, lo que impedía al navegador sintetizar el oblicuo cuando se usa `font-style: italic`. **Fix**: en `frontend/src/utils/inlineMarkdown.jsx` el `<em>` se renderiza con `style={{ fontStyle: 'italic', fontSynthesis: 'style' }}` inline — autoriza la síntesis sólo donde la necesitamos, sin tocar la regla global. Mismo enfoque defensivo: `<strong>`, `<s>` y `<a>` también pasan a `style` inline (`fontWeight: 700`, `textDecoration: 'line-through' | 'underline'`) en lugar de `className` (`font-bold`, `line-through`, `underline`) para no depender de que Tailwind aplique la clase con la specificity suficiente en el contexto donde se renderice.
- **Símbolo del fact aparecía dos veces**. `EventoFunButton.jsx` lo pintaba en la "pelota animada" que cae **y** dentro del `<Message>` del popover, arriba del texto. **Fix**: se elimina el `<SymbolGlyph>` del popover en `FactPopover` y `MobileFactBanner`; el símbolo queda únicamente en la pelota.

#### Cambiado

- **`frontend/src/utils/inlineMarkdown.jsx`**: regex `TOKEN_PATTERN` ahora se declara como pattern de sólo lectura; cada llamada a `renderInlineMarkdown(text)` instancia un `new RegExp(...)` propio para no acarrear `lastIndex` global entre invocaciones (bug latente: tras un primer render el `lastIndex` podía quedar en una posición intermedia y la segunda llamada del mismo string no encontraba matches al inicio).

#### Coordinación

- En paralelo, el admin (mariachi 1.9.0) sustituye su `Input.TextArea` por el `MarkdownTextArea` con toolbar de markdown inline (B/I/S/Link/Símbolo). Ver `mariachi/docs/CHANGELOG.md [1.9.0]`.

---

## [1.32.0] - 2026-05-21

### Eventos: barra de acciones del submenu (compartir, reportar, dato curioso) + apertura por URL + basemap por evento

El submenu de cada evento gana una barra de acciones bajo el título (gated por `IS_NON_PROD`, border naranja para indicar beta a nivel de barra completa). Reemplaza el botón ambiguo de papelera (que confundía "apagar capas externas" con "eliminar capas") y suma compartir, reportar y un botón lúdico con datos curiosos animados. En paralelo el evento soporta apertura directa por URL y selección de mapa base que se aplica al abrir y se restaura al cerrar.

#### Agregado

- **`<EventoActionsBar>`** (`frontend/src/pages/maps/components/EventoActionsBar.jsx`, nuevo): contenedor único con border `border-orange` y un único badge "beta" a la izquierda etiquetando toda la barra.
  - **Switch "Solo este evento"**: reutiliza `<Switch>` existente. Al activarse oculta las capas externas vía `setHiddenLayerIds` (no las apaga ni las elimina del panel de capas activas); `addedByUsRef` recuerda sólo las que el switch ocultó, así al desactivar el switch restaura únicamente esas — sin descongelar ocultamientos que el usuario hizo manualmente.
  - **Botón Compartir**: icono-only (estilo `ICON_BUTTON` consistente con el balón y Colibri). Copia al portapapeles `${origin}${BASE_URL}mapa?evento=${slug}` usando `import.meta.env.BASE_URL` (respeta `VITE_BASE_PATH=/mapalab/` en prod). Prioriza `evento.slug` del backend sobre `slugifyTitulo(titulo)`. Feedback con ícono `done` verde + label "Copiado" durante 1.5s. Telemetría `evento_share` (status `ok|error`).
  - **`<EventoFunButton>`** (`frontend/src/pages/maps/components/EventoFunButton.jsx`, nuevo): botón circular con el símbolo configurado del evento. Al click spawn de un balón animado que rebota (3 rebotes decrecientes 55%/80%/93% del recorrido, easing per-keyframe que simula gravedad, padding final 4px al ras del viewport, `BALL_SIZE_PX=28`) y, cuando se detiene (`BALL_STOP_DELAY_MS=3700ms`), aparece el popover con el dato curioso anclado a la posición final del balón (flecha hacia abajo apuntándole). Cap a 10 balones simultáneos. En mobile el popover pasa a banner top-center fijo (sin flecha, sin asociación al botón). Cierre por click afuera o autodismiss 10s. Honra `prefers-reduced-motion`. Telemetría `evento_fun_fact`.
  - **Botón Reportar**: `<ReportButton variant="floating">` con `extraContext` `{source: 'evento_actions_bar', evento_id, evento_titulo}` + nueva prop `onTrack` que dispara `trackEventoReport(eventoId)` antes de abrir Colibri.

- **Apertura por URL**: nuevo hook `frontend/src/pages/maps/hooks/useAutoOpenEventoFromUrl.js`. Lee `?evento=` del query string en `<MapSider>` y resuelve contra `evento.id`, `evento.slug` o `slugifyTitulo(evento.titulo)`; al match, `setIsHovered(true)` + `setAutoOpenMenuId('evento-{id}')` con 300ms de delay (mismo patrón que `shouldAutoOpenSearch`). Idempotente vía `processedRef`. Override `max-lines: 320` para `MapSider.jsx` siguiendo el patrón de otros archivos del repo.

- **Basemap por evento**: `<EventoMenu>` lee `evento.basemapId`; al montar guarda el `baseMapId` actual en `baseMapIdRef.current` y aplica el del evento. Al desmontar restaura. El effect sólo reacciona a `evento.id`/`evento.basemapId` (no a `baseMapId`), así un cambio manual del usuario durante la sesión del evento no se "corrige".

- **Datos curiosos por evento**: cada evento puede listar facts. Estructura `{text, symbol?}` donde `symbol` es un snapshot del catálogo MapaLab → Símbolos (`{symbolId, kind, value, imageUrl, name}`). `FactRef` Pydantic acepta strings legacy (`@model_validator(mode='before')`) para backwards-compat con facts capturados como strings sueltos. Shuffle bag por evento en `helpers/funFactPicker.js`: no repite hasta agotar el pool.

- **Símbolos del catálogo**: nuevo `<SymbolGlyph>` en `frontend/src/pages/maps/components/SymbolGlyph.jsx`. Renderiza el snapshot inline: `kind='emoji'` como texto con font emoji, `svg|image` como `<img>`. Fallback a ⚽ si no hay símbolo. El botón del balón usa el `funIcon` del evento; el balón rebotado usa `fact.symbol || evento.funIcon || ⚽`; el popover muestra **solo** `fact.symbol` cuando está explícitamente en mariachi (sin fallback al funIcon ni al default).

- **Telemetría**: `trackEventoShare(eventoId, status)`, `trackEventoReport(eventoId)`, `trackEventoFunFact(eventoId)` en `services/analyticsService.js`. Cada uno emite el evento específico + el `map_interaction` genérico vía `withMapInteraction` (mismo patrón que el resto del visor).

- **`<ThemeMenu>` con slot `actionsBar`**: nueva prop opcional que renderiza un nodo entre el header y el `<ScrollContainer>`. Backwards-compatible: los menús de tema normales no la pasan y siguen igual.

- **Keyframe CSS `evento-fun-bounce`** en `frontend/src/index.css`: animación de 5200ms con caída vertical pura, tres rebotes decrecientes y estancia ~1.5s antes del fade. `animation-timing-function` per keyframe (ease-in en caídas, ease-out en rebotes) para simular gravedad real. Media query `prefers-reduced-motion` colapsa a 200ms ease-out.

#### Coordinación

- **Backend mariachi**: nuevas columnas `eventos.facts JSONB DEFAULT '[]'`, `eventos.fun_icon JSONB`, `eventos.basemap_id VARCHAR(50)` (3 migraciones Alembic: `a8b9c0d1e2f4`, `a8b9c0d1e2f6`, `a8b9c0d1e2f7`). Schema `EventoBase`/`EventoUpdate` con `facts: list[FactRef]`, `funIcon: SymbolSnapshot | None`, `basemapId: str | None`. Cache server-side se invalida vía `notify_eventos_changed()` al publicar/editar el evento.
- **Admin mariachi**: tab "Diversión" en el editor de eventos con `<FactsField>` (usa `<MarkdownTextArea>` reutilizado de avisos para soportar markdown inline en el texto, toolbar combinada con subir/bajar/eliminar gracias a nueva prop `extraActions` en `MarkdownTextArea`); `<SymbolSnapshotField>` con `<SymbolPicker>` del catálogo en Popover. Selector de basemap (Carto Voyager / Carto Light / Sin mapa base) en tab "Apariencia". Detalles en `mariachi/docs/CHANGELOG.md [1.8.0]`.

## [1.31.0] - 2026-05-21

### Avisos de capas: cursivas, tachado y enlaces en el inline markdown

El render inline de los avisos sólo soportaba `**negritas**`. Se amplía para reconocer también `*cursivas*`, `~~tachado~~` y `[texto](url)`. El admin (mariachi) gana en paralelo una toolbar para escribir estos formatos sin teclear el markdown a mano.

- **`frontend/src/utils/inlineMarkdown.jsx`** (nuevo): helper `renderInlineMarkdown(text)` centralizado. Una sola expresión regular consume tokens (`[texto](url)`, `**bold**`, `~~strike~~`, `*italic*`) en orden de aparición para evitar el problema clásico de regex inestables al combinar varios formatos. Los enlaces requieren protocolo http(s), abren en pestaña nueva con `rel="noopener noreferrer"`. Los formatos no reconocidos quedan como texto plano.
- **`frontend/src/components/Message.jsx`** y **`frontend/src/pages/maps/components/LayerNotices/BannerNotice.jsx`**: eliminadas las dos copias locales de `renderInlineMarkdown` (que sólo manejaban bold); ambos archivos importan el helper común de `@utils/inlineMarkdown`.

## [1.30.0] - 2026-05-20

### Eventos sale de beta + saneamiento del bundle WMS

`Eventos` deja de mostrar el badge "BETA" en `EventoIconButton`. La feature flag `VITE_EVENTOS_BETA_BADGE` (introducida temporal en versiones anteriores) se elimina del código y de `.env.example`; el import de `Badge` también se quita del componente.

En paralelo se diagnosticó y limpió un `EncodingError: The source image cannot be decoded` que aparecía en consola al abrir cualquier evento. Causa raíz: `useWMSLayerFactory` agrupa todas las capas de workspace `eventos` (`baseUrl|wmsGroup` compartidos) en un único `GetMap`; 4 capas del catálogo (`limite_de_velocidad`, `paradas_tp`, `rutas_complementarias_tp`, `rutas_troncales_tp`) apuntaban a tablas PostGIS inexistentes en `dataengine-primary.iieg_gis.eventos`. GeoServer respondía `ServiceException` XML con `HTTP 200`, el browser intentaba decodificarlo como PNG y el bundle entero se caía.

#### Agregado

- **`useWMSLayerFactory`: log `imageloaderror`**: el listener ahora captura `event.image.getImage().src` y emite `console.warn('[WMS imageloaderror]', { layerId, src, baseUrl, params })` cuando `import.meta.env.DEV` está activo. Permite identificar exactamente qué capa genera la respuesta no decodificable la próxima vez que aparezca el síntoma. En producción no se ejecuta el warn ni se construye el payload — el `onLoadEnd?.(layerId)` sigue corriendo igual.

#### Corregido

- **`EventoIconButton`**: badge "BETA" y `SHOW_BETA_BADGE` removidos. El componente ya no necesita el gate de env var y queda más simple. `.env.example` actualizado para reflejar el cambio.
- **`LayerDetailModal`: scrollbar consistente con el resto del app**. El contenedor scrollable usaba `scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400`; ninguna de esas clases existe en `index.css` (Tailwind v4 sin plugin de scrollbar), así que caía al default del browser. Cambiado a `scrollbar-thin scrollbar-thumb-gray-400`, el mismo patrón que ya usa `Modal.jsx`.
- **Catálogo: 4 capas fantasma soft-deleted en `mapalab.layers`**. `auto-eventos-limite-de-velocidad`, `auto-eventos-paradas-tp`, `auto-eventos-rutas-complementarias-tp`, `auto-eventos-rutas-troncales-tp` marcadas con `deleted_at` y `deleted_by='cleanup-ghost-eventos'`. El filtro `Layer.deleted_at.is_(None)` en `LayersRepository.get_all_layers/get_max_updated_at/count_layers/search_layers` (soft-delete del modelo `Layer` introducido en esta misma versión) las excluye del árbol publicado. Cache de árbol regenerado vía `POST /layers/refresh-cache`.

#### Coordinación

- Las 4 capas siguen publicadas en GeoServer (`GetCapabilities` aún las lista). Limpieza completa requiere unpublish manual en GeoServer admin o restaurar las tablas faltantes en `dataengine-primary.iieg_gis.eventos`. Ver nuevo `Escenario 9` en `docs/runbook-layers.md`.

### Agregado

- **Eventos: soporte de categorías**: `<EventoMenu>` ahora acepta `tipo: 'categoria'` (además de `etiqueta` y capas) en `evento.capas`. Una categoría es un nodo con `alias` y un sub-array `capas` que se renderiza como carpeta expandible/colapsable (reutilizando `CategoryItem` de `ThemeMenu`). Profundidad limitada a un nivel (consistente con la jerarquía del árbol principal: tema → categoría → etiqueta/capa); las sub-categorías anidadas se descartan silenciosamente. `eventoHelpers.collectEventoLayerIds` y la auto-activación recorren recursivamente las categorías, así que el contador de "capas externas activas" y el `findEventoByLayerId` siguen funcionando para capas que viven dentro de categorías.

## [1.29.0] - 2026-05-19

### Aviso configurable por capa (notice)

Algunas capas necesitan comunicar al usuario un contexto que no cabe en su título ni en la tarjeta de detalle: datos preliminares, vigencia, cambios recientes, enlaces a la fuente. Hasta ahora la única vía era editar la descripción del feature type, que vive en otra sección y se ve solo al abrir el modal. La nueva característica permite mostrar un banner sobre el mapa, configurable desde mariachi, que aparece mientras la capa está activa y dentro de su rango de zoom.

#### Agregado

- **Columna `mapalab.layers.notice` (JSONB)**: nueva migración alembic `0009_layer_notice` en dataengine. Shape `{ enabled, title, description, icon, variant, position, dismissible, validFrom, validUntil, cta }`. Entra automáticamente vía `make prod-migration` (que ya corre `alembic upgrade head`).
- **Editor en mariachi**: nuevo tab "Aviso" en `LayerEditPage` (visible para `group` y `leaf`). Form con habilitar/deshabilitar, contenido (título, descripción, icono via `BucketFilePicker` apuntando al bucket `iieg`), presentación (variante info/warning/neutral, posición top-center/bottom-center, descartable, permanencia del cierre `permanent`/`reopen`), visibilidad por zoom opcional (hereda de la capa si se deja vacío), vigencia opcional con fechas (vacío = permanente) y enlace opcional (CTA). Preview en vivo con badges de metadata.
- **Iconos en Acervo**: set inicial subido a `iieg/iconos/` (alert, info, tiempo_alert, rendimiento "caracol", warning, aviso_privacidad, novedades). Convención global de iconos compartidos entre secciones. El admin puede agregar más vía media uploader.
- **Component `<Message>` extendido**: detecta automáticamente si `icon` es URL (`http(s)://`, `/acervo/`, `/api/`) y la renderiza como `<img>`; si es un nombre simple sigue usando `externalIcons`. Usable por cualquier consumer (slow_loading_warning, layer notices, futuros).
- **Backend mapalab**: el árbol publicado en `/layers/tree` incluye `notice` sólo cuando `enabled === true` (ahorra payload). Soportado tanto en el refresh job de dataengine (`run_refresh_layer_tree.py`) como en el constructor in-process del backend (`layer_tree_service.py`).
- **Frontend mapalab**:
  - `helpers/noticeHelpers.js` con utilidades puras: filtros por vigencia, rango de zoom, hash de contenido para dismiss persistente.
  - `hooks/useLayerNotices.js` con `useSyncExternalStore` sobre el zoom del mapa; reacciona a `change:resolution` del view OL.
  - `components/LayerNotices/` con contenedor por posición y tarjeta visual con CTA opcional.
  - En swipe: el aviso aparece **una sola vez** aunque la capa esté en ambos slots (unión deduplicada).
  - Dismiss persistente en `localStorage` con clave `mapalab.notice.dismissed.<layerId>.<hash>`. Si el editor cambia el contenido, el hash cambia y el aviso vuelve a mostrarse.
- **Telemetría** (GA4 + collector Mariachi): `layer_notice_view` (impresión), `layer_notice_dismiss` (cierre), `layer_notice_cta_click` (click en enlace).
- **Visor embebido**: atributo `notices="false"` en el web component `<iieg-mapalab>` para desactivar avisos en sitios anidados. Se propaga como query param `notices=false` al iframe.

## [1.28.5] - 2026-05-15

### Auth interna en `/layers/refresh-cache` e `/layers/invalidate-cache`

Hasta `1.28.4` ambos endpoints aceptaban requests anonimos. La unica defensa era el `return 403` que `gateway-hub` aplica en las rutas `/mapalab/api/layers/refresh-cache` e `/invalidate-cache`. Para servicios co-residentes en `iieg-network` (cualquier container que llegue directo a `mapalab-backend-1:8000`) eso no servia: podian invalidar el cache sin token y abusar del refresh para forzar carga sobre dataengine.

#### Agregado

- **`app/auth/internal_token.py::require_internal_token`**: dependency reusable que valida el header `X-Internal-Token` contra `settings.MAPALAB_INTERNAL_TOKEN`. Retorna `503` si el server no tiene el token configurado, `401` si el header esta ausente o es incorrecto. Mismo contrato que la funcion local `_require_internal_token` que existia en `shares.py` (no se refactoriza para mantener el cambio minimo).
- **`app/routers/layers.py`**: `dependencies=[Depends(require_internal_token)]` en `refresh_cache_endpoint` (linea 69) e `invalidate_cache_endpoint` (linea 80).
- **`test/test_smoke.py::TestLayersAdminAuth`**: 5 tests que cubren el contrato: rechazo sin token, con token incorrecto, 503 cuando el server no tiene token configurado, aceptacion con token correcto, e invalidate sin token.

#### Coordinacion

- Requiere `mariachi >= 1.0.3` (el notifier ya envia el header `X-Internal-Token`).
- `MAPALAB_INTERNAL_TOKEN` debe coincidir exactamente entre `mapalab/.env*` y `mariachi/.env*`.

#### Notas

- Si en algun entorno `MAPALAB_INTERNAL_TOKEN` queda vacio en mapalab, los endpoints devuelven `503` y los reintentos del notifier los marcan como fallidos. El `etag-check` de mem cache en cada request sigue resincronizando contra DB, asi que el tree no queda permanentemente stale; solo se pierde la actualizacion inmediata.

## [1.28.4] - 2026-05-15

### Loop temporal: default subido de 0.5 s a 1 s

`DEFAULT_LOOP_INTERVAL_MS` en `frontend/src/pages/maps/hooks/useDateLoop.js` cambiado de `500` a `1000`. A 0.5 s con GCP saturado o cold cache, el ojo no alcanza a "leer" el cambio entre frames raster y la animacion se siente como flicker mas que como evolucion temporal. Un segundo da tiempo suficiente para que el usuario perciba la transicion mes-a-mes y, de paso, alivia presion sobre GeoServer en el primer ciclo. El preset de 0.25 s y 0.5 s siguen disponibles para quien quiera tempo mas rapido; solo cambia el valor inicial cuando se da Play por primera vez.

Tests existentes (`useDateLoop.test.js`) pasan sin modificaciones porque referencian `DEFAULT_LOOP_INTERVAL_MS` por simbolo, no por valor literal.

## [1.28.3] - 2026-05-15

### Loop temporal: tope de reintentos alineado con `proxy_cache_lock_timeout`

`MAX_LOADING_RETRIES` en `frontend/src/pages/maps/hooks/useDateLoop.js` subido de `100` (~10 s) a `300` (~30 s). El valor anterior era mas estricto que el `proxy_cache_lock_timeout` que dejamos en gateway-hub (30 s), causando un caso degenerado en GCP saturado: el primer ciclo del loop muere en silencio antes de que GeoServer rinda y nginx cachee el primer frame. Tras alinear ambos topes, el primer ciclo puede tolerar frames lentos mientras se hidrata el cache, y los ciclos siguientes corren al tempo solicitado (0.5 s/2 s/etc.) sin problema. Si un frame realmente tarda mas de 30 s, el auto-stop sigue actuando.

---

## [1.28.2] - 2026-05-15

### Robustez del loop temporal de capas raster

Conjunto de correcciones en `frontend/src/pages/maps/hooks/useDateLoop.js` detectadas en una revisión a fondo del motor de animación del loop. Cinco bugs latentes, todos aislados a este hook; los 13 tests de `useDateLoop` siguen pasando sin modificaciones.

#### Fixed

- **Stale closures de `allLayers`**: `inferLoopConfig` (`useCallback([])`) y el effect de aplicación de filtros por defecto capturaban un `allLayers` posiblemente vacío al primer render. `LayersProvider` hidrata el árbol de forma asíncrona; para capas raster activadas antes de la hidratación esto rompía el inferido y dejaba sin aplicar el filtro `date` por defecto. Ahora `inferLoopConfig` lee `allLayers` vía `refs.current.allLayers` siempre fresco, y el effect lo incluye en sus deps para re-correr cuando el árbol se hidrata. Se eliminaron dos `// eslint-disable-next-line react-hooks/exhaustive-deps` que enmascaraban el problema.
- **Timers huérfanos al desmontar**: la cadena recursiva de `setTimeout` del tick seguía viva tras un unmount del provider, ejecutando `applyFilter` sobre un árbol desmontado. Nuevo `useEffect` con cleanup que vacía `timersRef` al desmontar.
- **Hang silencioso por loading perpetuo**: si una capa quedaba marcada como cargando indefinidamente (frame que erroniza al tile loader), el gate `loadingLayers.has(layerId)` reprogramaba un retry cada 100 ms sin tope, dejando el loop girando en vacío sin feedback. Se introdujo `MAX_LOADING_RETRIES = 100` (~10 s); al excederse, el loop se detiene y emite `trackRasterLoop(layerId, false)`. El contador se resetea en cada tick exitoso y al reanudar con `toggleLoop`.
- **Filtro `date` huérfano tras desactivar una capa raster**: cuando una capa recibía el filtro por defecto vía el effect inicial pero el usuario nunca daba Play, al desactivarla `cleanupLoop` no se invocaba (porque no había entrada en `dateLoops`), por lo que el filtro persistía en el estado de `useCQLFilter`. Ahora el bloque de cleanup de `appliedDefaultsRef` también llama `clearFilter(id, 'date')` para layers raster recién desactivadas. Los filtros restaurados desde share/URL se re-aplican en carga, así que no se pierden.

### Renombrado del repositorio `mapalab-dataengine` → `dataengine`

Se actualizaron las referencias al repo de infraestructura de datos, ahora llamado `dataengine`, en docs, `Makefile` y `backend/app/services/scheduler_service.py`.

## [1.28.0] - 2026-05-13

### Instrumentación HTTP del backend para Prometheus

El endpoint `/metrics` ya emitía counters de negocio (`mapalab_tree_requests_total`, `mapalab_download_requests_total`, etc.) pero no métricas HTTP estándar. Las reglas `HighLatency` y `HighErrorRate` de huachicol quedaban inactivas para mapalab porque dependen de `http_request_duration_seconds` y `http_requests_total{status}`. Se agrega `prometheus-fastapi-instrumentator` para emitirlas sin romper el render manual existente.

#### Agregado

- **`prometheus-fastapi-instrumentator`** en `backend/requirements.txt`. Sin pin de versión, resuelve a 7.x compatible con FastAPI 0.111+.
- **Hook en `backend/app/server.py`** justo después del `CORSMiddleware`: `Instrumentator(...).add(metrics.requests()).add(metrics.latency(...)).instrument(app)`. Buckets de latencia ajustados a `(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10)` para granularidad fina hasta 5ms. `excluded_handlers=["^/metrics$", "^/health$", "^/ontoy$", "^/$"]` para no auto-instrumentar el scrape ni los endpoints de plataforma.
- **`backend/app/metrics.py`** concatena `generate_latest(REGISTRY).decode('utf-8')` al final del render manual. El mismo endpoint `/metrics` expone counters de negocio + HTTP estándar en un solo scrape.

#### Seguridad

- **`nginx/nginx.conf`**: nuevo bloque `location = /mapalab/api/metrics { deny all; return 403; }` antes del proxy genérico `/mapalab/api/`. Defense-in-depth contra exposición pública vía `mapalab-nginx:3006` que bindea a `0.0.0.0`. El scrape interno desde Prometheus (a `mapalab-backend-1:8000` directo, sin pasar por nginx) sigue funcionando.

#### Notas

- **Cuidado con `excluded_handlers`**: usa `re.search`, no match exacto. Un patrón como `"/"` matchea cualquier path que contiene `/` (o sea, todos). Usar anclas `^...$`.
- Mapalab corre con 8 workers gunicorn. El instrumentator usa `prometheus_client` sin `multiprocess_mode`, por lo que cada worker mantiene sus propios counters y `/metrics` solo refleja el worker que sirvió el request. Aceptable porque Prometheus scrapea cada 15s y `sum/rate` consolidan. Si se requiere consolidación cross-worker, configurar `PROMETHEUS_MULTIPROC_DIR`.

## [1.27.0] - 2026-05-13

### Telemetría anónima del visor → Mariachi

Sistema de eventos de uso del visor para entender qué capas, herramientas y botones son los más usados, además de quién entra al swipe y cuánto dura una sesión típica. Anónimo, append-only y persistido en Mariachi para consumo desde el panel admin.

#### Agregado

- `services/telemetryService.js`: buffer en memoria con flush cada 30s o 50 eventos, `sendBeacon` en `pagehide` para no perder eventos al cerrar la pestaña. Session UUID en `sessionStorage` con expiración de 4h. Honra Do-Not-Track del navegador. Heartbeat cada 60s mientras la pestaña esté visible para calcular duración real de la sesión. Endpoint configurable vía `VITE_MARIACHI_PUBLIC_API_HOST`, toggle por `VITE_TELEMETRY_ENABLED`.
- `services/analyticsService.js`: inyectado el collector en el `trackEvent` central. Todos los trackers que ya existían (`trackLayerToggle`, `trackFeatureClick`, `trackMapZoomLevel`, `trackBasemapChange`, `trackDrawingTool`, `trackShareMap`, `trackInfoOpen`, `trackReportSubmitted`, `trackEventoOpen/Close`, etc.) ahora también emiten a Mariachi sin tocar cada componente.
- Trackers nuevos: `trackThemeChange`, `trackOpacityChange`, `trackLegendsToggle`, `trackSwipeEnter`, `trackSwipeExit`, `trackSwipeSlotChange`, `trackInfoBoxAction`, `trackHomeAction`, `trackContributeClick`, `trackLogoClick`, `trackLayerReorder`, `trackMeasurementTool`, `trackEmbedView`.

#### Instrumentación

- `hooks/useSwipeMode.js`: `swipe_enter` al activar el comparador con la orientación elegida, `swipe_exit` al salir con duración en segundos.
- `components/ActiveLayers/SlotBadge.jsx` (vía `LayerDateControls.jsx` y `ActiveLayerItem.jsx`): `swipe_slot_change` con `from`/`to`/`layer_id` al ciclar A → AB → B.
- `components/ActiveLayers/LayerOpacityPopover.jsx` (vía `LayerActionsBar.jsx`): `opacity_change` con debounce 500ms.
- `components/ActiveLayers/hooks/useLegendsVisibility.jsx`: `legends_toggle` al cambiar el switch global.
- `components/ActiveLayers/hooks/useLayerSorting.js`: `layer_reorder` con índice origen/destino al hacer drag & drop.
- `components/ThemeMenu.jsx`: `theme_change` al abrir el menú de un tema.
- `components/InfoBox/components/InfoBoxTools.jsx`: `infobox_action` con `action`/`layer_id` por cada botón del InfoBox.
- `components/MapSider.jsx`: `logo_click` al clickear el logo IIEG (el que abre el modal de novedades).
- `pages/home/components/Body.jsx` y `Card.jsx`: `home_action` para `section_open/close`, `faq_toggle`, `subtopic_click`.

#### Sin cambios para el usuario final

La telemetría es anónima. No se identifica a la persona — solo IP hasheada con salt diario y familia del User-Agent ("Chrome", "Mobile", etc.). El collector se silencia automáticamente si DNT está activo. GA4 sigue funcionando en paralelo, este sistema lo complementa con SQL libre desde el panel.

## [1.26.0] - 2026-05-13

### Resiliencia del WFS DescribeFeatureType y conteo coherente de capas en la tarjeta IIEG

Se elimina la tormenta de peticiones `DescribeFeatureType` que producía 429 al activar varias capas seguidas, y se alinea el contador "Capas disponibles" del marcador IIEG con la representación visual del panel de capas activas (un `forceGroup` con sus hijos = 1 unidad).

#### Rendimiento

- `utils/featureInfoUtils.js`: el caché de columnas/tipos de geometría ahora tiene tres mecanismos extra encima del LRU de 500 entradas existente:
  - **Cache negativo con TTL de 60 s** (`negativeCache`): si un `DescribeFeatureType` falla (red, 429, XML inválido) o si la respuesta no incluye el typename pedido, se anota la falla y `fetchGeometryColumns` no vuelve a reintentar hasta que expire. Resuelve los `429 Too Many Requests` repetidos contra `/geoserver/wfs` al activar varias capas seguidas.
  - **Dedupe in-flight** (`inflightByKey`): si `useAlwaysOnTopPinning` y `LayerDetailModal` piden la misma capa simultáneamente, sale una sola petición y ambos consumers comparten la promesa.
  - **Batch por microtask** (`pendingByUrl` + `resolversByKey`): las llamadas síncronas dentro del mismo tick (típico `Promise.all(idsToCheck.map(...))` en `useAlwaysOnTopPinning`) se agrupan en una sola petición WFS con `TYPENAME=a,b,c,...`. Activar 5 capas a la vez = 1 request, no 5.
- La firma pública (`fetchGeometryColumns`, `fetchGeometryType`) no cambió: los call sites (`useAlwaysOnTopPinning`, `LayerDetailModal`, `featureInfoService`) siguen funcionando sin tocarlos.

#### Cambiado

- `pages/maps/helpers/layers/utils/layerHelpers.js`: nuevo helper `collectCatalogUnits(layer)` que recorre el árbol y cuenta como **una sola unidad** cada nodo `forceGroup` (absorbiendo sus hijos), respeta `isLabel`/`isCategory` igual que `unifiedLayers` en `useActiveLayersLogic`, y cuenta como uno cada leaf con `wmsConfig`. `collectLayersWithWMS` se mantiene intacto porque `useFeatureInfo` necesita enumerar todos los descendientes activos al consultar features por click.
- `pages/maps/helpers/markerDefinitions.js`: `computeIiegStats` pasa de `collectLayersWithWMS` a `collectCatalogUnits` para `totalLayers`. La cifra "Capas disponibles" del marcador IIEG ahora coincide con cómo se ven los items en el panel de capas activas (un grupo + sus hijos = 1 entrada).

#### Documentacion

- `docs/cache.md`: actualizadas las entradas `geometryColumnCache`/`geometryTypeCache` con las nuevas constantes (`NEGATIVE_TTL_MS`, `inflightByKey`, `pendingByUrl`, `resolversByKey`) y se quita el comentario de deuda técnica al pie de la guía rápida.

## [1.24.0] - 2026-05-13

### Hardening del widget embebible: fallback, defense-in-depth, auditoría y Core Web Vitals

Ciclo de auditoría sobre el widget `<iieg-mapalab>` (DevOps + gobernanza). Se cubren los cuatro puntos técnicos: fallback con UX clara, defensa en profundidad contra clickjacking, auditoría de accesos con retención y captura de Core Web Vitals + errores JS desde sitios huésped.

#### Widget (`widget/`) — bump a `1.1.0`

- `src/element.js`: timeout configurable (`ready-timeout-ms`, default 8s) que dispara un overlay con botones "Reintentar" y "Abrir mapa en MapaLab" cuando el iframe no emite `mapalab:ready`. Manejo explícito de `mapalab:error` con el mismo overlay y mensaje específico del visor. Footer "Fuente: IIEG" en la esquina inferior derecha cuando el mapa carga. Nuevo evento `mapalab:timeout` para que el host externo pueda reaccionar (`{ ms, reason: 'no_ready_received' }`).
- Bundle pasa de ~19 KB a ~23 KB (8.4 KB gzip). Cero dependencias nuevas (sigue siendo solo Lit).

#### Visor embebido (`frontend/src/pages/embed/`) — bump a `1.24.0`

- `EmbedView.jsx`: validación cliente de `dominiosPermitidos` contra `document.referrer` (defense-in-depth contra clickjacking, complementa la validación server-side). Si el host externo no está en la allowlist, rinde `EmbedError` sin esperar a fallar el WMS proxy.
- `EmbedError.jsx`: botones "Reintentar" / "Abrir el visor completo" + atribución IIEG.
- `hooks/useEmbedTelemetry.js`: captura LCP, CLS, INP, FCP, TTFB con `web-vitals` + listeners de `error` y `unhandledrejection`. Envía via `navigator.sendBeacon` con fallback a `fetch keepalive`. Debounce 1.5s, máximo 8 vitales y 5 errores por flush. Marca `IFRAME_READY` cuando el visor monta para medir tiempo de arranque end-to-end.
- `hooks/useEmbedViewSync.js`: además de emitir `mapalab:viewchange`, ahora escucha `mapalab:setview` para que el admin pueda controlar el view del iframe sin recargar (necesario para "cargar vista guardada").
- `helpers/postMessage.js`: nuevo `postViewChange(payload)`.

#### Backend (`backend/app/`)

- `routers/embed.py`: nuevo endpoint `POST /embed/telemetry` (valida key, registra histograma + counters, sin contar para cuota). Validación de capas devuelve mensajes claros en español. `_validate_or_403` registra cada acceso (allowed/denied/quota_exceeded) en el access logger.
- `services/access_logger.py`: buffer in-memory + flush periódico cada 30s a Mariachi (`POST /internal/mapalab/keys/accesos`). Hash de IP con SHA-256 usando `MAPALAB_INTERNAL_TOKEN` como salt.
- `server.py`: `access_flush_loop` registrado en `lifespan` con flush final al apagar.
- `services/api_key_validator.py`: `ValidationResult.dominios_permitidos` agregado para que el visor lo use en defense-in-depth.
- `metrics.py`: API `observe()` para histogramas + serialización Prometheus completa con buckets. Nuevas métricas: `mapalab_embed_telemetry_total`, `mapalab_embed_vital_ms` (histograma con label `metric=LCP|CLS|INP|FCP|TTFB|IFRAME_READY`), `mapalab_embed_js_errors_total`.

#### UX del visor full (`frontend/src/pages/maps/components/ShareModal.jsx`)

- Lenguaje no técnico en español plano: "Estás viendo un mapa compartido" en vez de "Usando link compartido", "Hiciste cambios al mapa" en vez de "Estado modificado", botón "Generar enlace para compartir" en vez de "Crear enlace".
- Pestañas renombradas: "Compartir enlace" / "Insertar en otro sitio" (antes "Enlace" / "Embeber").
- Mensajes de error con caja roja y botón × para cerrar (antes era `<p>` sin descartar).

#### Notas

- Los pendientes de gobernanza (clasificación, T&C versionados, linaje, SLA visible, notificaciones de cambio) quedan documentados en `docs/planes/widget-pendientes.md` para retomar.
- El malentendido del auditor sobre "SIEEJ" se aclara: el widget vive en MapaLab; SIEEJ es solo uno de los sitios huésped.

---

## [1.23.0] - 2026-05-13

### Panel de mediciones consume catalogo remoto de simbolos

El catalogo hardcoded de emojis (`pages/maps/helpers/emojiCatalog.js`, 8 categorias y ~1000 emojis) se reemplazo por un fetch al endpoint publico de mariachi `GET /api/mapalab/symbols/catalog`. El admin puede agregar/quitar emojis, SVGs o imagenes desde `/mariachi/mapalab/simbolos` y los cambios se reflejan sin redeploy.

### Agregado

- `services/symbolsService.js`: fetch + cache en memoria del catalogo, con `invalidateSymbolCatalog()` para forzar recarga.
- `pages/maps/hooks/useSymbolCatalog.js`: hook React que carga el catalogo al montar el componente.
- `pages/maps/helpers/drawingStyles.js::createSymbolStyle(symbol, rotation, scale, selected)`: ruta segun `kind`:
  - `emoji` → reusa `createEmojiStyle` (TextStyle).
  - `svg` → IconStyle con data URL (`image/svg+xml;base64,...`).
  - `image` → IconStyle apuntando al URL del bucket Acervo.

### Cambiado

- `pages/maps/components/MeasurementTools/EmojiPanel.jsx`: consume el catalogo via hook. Renderiza el preview correcto segun el `kind` del item. Las clases CSS del panel quedan identicas (sin cambios visuales).
- `pages/maps/hooks/useEmojiTemplate.js`: el state ahora guarda el objeto `{kind, value, imageUrl, id}` en lugar de solo un string. Acepta entrada tipo string (legacy) o tipo objeto.
- `pages/maps/hooks/useMapDrawing.js`: al dibujar tipo `Emoji`, persiste `symbolPayload` en la feature y rutea por `createSymbolStyle` en lugar de `createEmojiStyle`.

### Eliminado

- `pages/maps/helpers/emojiCatalog.js`: el catalogo ya no vive hardcoded. La fuente de verdad es ahora `mapalab.symbols` en dataengine, administrado desde mariachi-admin.

---

## [1.22.0] - 2026-05-12

### Acople del panel de mediciones al sider restaurado

El panel de herramientas de medicion volvio a deslizarse con el ancho del sider y alinearse verticalmente con el boton "Herramientas", en lugar de quedar fijo en la esquina superior izquierda detras del sider.

#### Causa raiz

Desde `1.13.0` (`682da9f`), el item `tools` del menu lateral pasa de `hasMenu: false` (con `onClick`) a `hasMenu: true` (con submenu `ToolsMenu`). El item declara `ref: toolsButtonRef` esperando que `MenuItem` lo asigne al DOM, pero `MenuItem` solo propagaba `item.ref` en la rama `!item.hasMenu`. En la rama de items con submenu, el `<button>` usaba unicamente un `buttonRef` local (anchor del `<Panel>` desplegable), por lo que `toolsButtonRef.current` quedaba en `null` permanentemente.

`useSiderAdaptivePosition({ anchorRef: 'tools' })` en `ToolsPanel.jsx` lee ese ref para calcular `topPosition = anchorRect.top` y `leftPosition = width + siderOffset`. Con el ref vacio caia al `else` final que no setea `topPosition` y deja `leftPosition = leftOffset(16)`, colocando el div `fixed z-10` en la misma esquina que el sider (`z-20`) y por debajo en z-index.

#### Fix

`src/pages/maps/components/MenuItem.jsx`: el `<button>` de la rama `hasMenu: true` ahora usa un callback ref que asigna el nodo tanto al `buttonRef` local (que sigue siendo el anchor del `<Panel>`) como a `item.ref` cuando esta presente, soportando refs tipo objeto y funcion. Con esto `toolsButtonRef` apunta al DOM real y el `ResizeObserver` del sider re-dispara el calculo al expandir/colapsar.

## [1.21.1] - 2026-05-12

### Pin de capas-borde sobre poligonos

Las capas de limite (`limite_iieg`, `limite_municipal`, `regiones`, `limite_inegi`, `limite_municipal_inegi`) se fijan automaticamente arriba del mapa cuando hay otra capa de tipo poligono activa, para que sus etiquetas no queden tapadas por coropletas tematicas.

#### Frontend

**Nuevos:**
- `src/pages/maps/hooks/useAlwaysOnTopPinning.js`: hook que detecta poligonos no-borde via `fetchGeometryType` (WFS `DescribeFeatureType`). Devuelve `Set<pinnedIds>` con las capas-borde activas a pinear. Excluye capas de fondo via `BACKGROUND_POLYGON_LAYER_NAMES` (`general:cuerpos_de_agua_50k`, `economia:cultivos`, `recursos:areas_naturales_protegidas`). Regla desactivada en swipe AB. Exporta `PIN_Z_OFFSET=9000` y `sortItemsWithPinnedFirst(items, pinnedSet, initialOrder)`.
- `src/assets/icons/ico_pin_normal.svg` + `ico_pin_hover.svg`: thumbtack 24x24 siguiendo estilo `ico_*` (gris `#465055` / morado `#70308A`).

**Refactorizados:**
- `src/pages/maps/hooks/useWMSLayerManager.js`: acepta `pinnedLayerIds` + `initialOrder`. Override de `maxZIndex = PIN_Z_OFFSET + (order.length - effectiveIdx)` cuando el grupo esta pin-eado, respetando `initialOrder` entre multiples pin-eadas. Nuevo effect que dispara re-update cuando cambian estos.
- `src/pages/maps/components/MapView.jsx`: instancia `useAlwaysOnTopPinning` con `compareModeActive` apropiado por pane (live vs swipe) y pasa `pinnedLayerIds`+`initialOrder` al manager.
- `src/pages/maps/components/ActiveLayers/ActiveLayersList.jsx`: aplica `sortItemsWithPinnedFirst` para que el panel quede WYSIWYG con el mapa.
- `src/pages/maps/components/ActiveLayers/ActiveLayerItem.jsx`: acepta prop `isPinned`. Cuando es true oculta `DragHandle` y renderiza `PinBadge`.
- `src/pages/maps/components/ActiveLayers/LayerItemHeader.jsx`: nuevo export `PinBadge` con tooltip explicativo.

**Tests:**
- `src/test/pages/maps/hooks/useWMSLayerManager.test.js`: 4 casos nuevos (z-index normal sin pin, override con pin, no afecta no-pin-eadas, respeta `initialOrder` entre multiples).

#### Documentacion
- `docs/planes/PLAN_BACKGROUND_POLYGON_EDITABLE.md` (nuevo): plan para mover la lista de fondos a un flag `es_fondo_visual` editable desde mariachi (migracion, backend, UI, cleanup frontend).

#### Operacional
- `Makefile`: `make deploy` ahora purga `/var/cache/nginx/mapalab_assets/*` en el gateway-hub antes del reload, para evitar servir `index.html` viejo tras un deploy.

## [1.21.0] - 2026-05-08

### Reportes: migrar a widget Colibri

Reemplaza el sistema propio de reportes (`ReportModal` + `feedbackService`) por el widget embebible de Colibri (`/colibri/widget/colibri-widget.v1.js`) para centralizar reportes del ecosistema IIEG en un solo backend con stats, dedupe, fan-out a Discord/Slack y form dinamico.

#### Frontend

**Componentes nuevos:**
- `src/hooks/useColibriOpen.js`: hook que dispara el panel global de Colibri. Construye `auto`/`user`/`sourceContext` con snapshot del mapa (basemap, capas activas, view, compare mode), llama `window.colibri.identify()` con datos del usuario logueado y `setContext()` con el resto.

**Refactorizados:**
- `src/components/ReportButton.jsx`: pasa de envolver `ReportModal` propio a un `<button>` HTML con tailwind matching el lenguaje visual del mapa (bg blanco, text gris hover morado, w-7 h-7 md:w-6 md:h-6, rounded-full, shadow sutil). Variant `inline` mantiene estilo link-with-icon.
- `src/pages/maps/components/MapAttribution.jsx`: el boton se monta como hermano del pill de Contribuciones en el mismo flex container (`gap-2`). Mismo alto, alineado a la izquierda.
- `src/pages/maps/components/InfoBox/InfoBox.jsx`: el handler `action='report'` del marker IIEG ahora llama `useColibriOpen({ source: 'iieg_marker' })`.
- `src/pages/home/components/Footer.jsx`: el boton se envuelve en `<div className="fixed bottom-4 right-4 z-50">` para que flote sobre el home.

**Eliminados:**
- `src/components/ReportModal.jsx`, `src/services/feedbackService.js`, `src/test/services/feedbackService.test.js`, `src/pages/maps/components/MapReportButton.jsx`.

#### Infraestructura

- `frontend/index.html`: `<script src="/colibri/widget/colibri-widget.v1.js" defer>` antes de `</head>`. CSP `script-src 'self'` lo permite (path relativo).
- `frontend/vite.config.js`: nuevo proxy `/colibri` -> `MARIACHI_DEV_TARGET`.
- `frontend/Dockerfile` + `docker-compose.yml`: ARGs y env vars `VITE_COLIBRI_SOURCE_APP=mapalab` y `VITE_COLIBRI_API_KEY` (en frontend dev y frontend-build args).
- `.env.example`: documenta las dos vars.

#### Compatibilidad

El endpoint publico (`POST /api/public/reportes`) es el mismo. Los reportes anteriores se conservan en la BD. El widget agrega header `X-Colibri-Key` para autenticar como `source_app=mapalab` con CORS dinamico, rate limit por huesped, dedupe y fan-out.

#### Pendiente

Recuperar el `captureFn` del mapa (screenshot pre-renderizado) requiere un metodo nuevo `attachScreenshot(blob)` en el widget de mariachi.

## [1.20.3] - 2026-05-07

### Corregido
- **Panel de capas activas: ya no se traslapa con la atribución del mapa**: cuando el panel crecía a la altura completa del viewport, su borde inferior chocaba con `<MapAttribution>` (badge "Contribuciones ©" + `ReportButton` flotante en la esquina inferior derecha). Se aumenta la reserva inferior del `Panel` que envuelve `<ActiveLayersList>` (en `MapLayersPanels.jsx`) de `7.5rem`/`8rem` a `9.5rem`/`10rem` para desktop/mobile. Pierde ~32 px de altura útil del panel a cambio de mantener la atribución visible (requisito legal de OSM/Carto).

## [1.20.2] - 2026-05-07

### Corregido
- **Eventos: revertir persistencia por sesión de bbox-fit y auto-activación de capas**: en v1.20.0 se introdujo un flag en `sessionStorage` (`evento:zoomed:{id}` y `evento:auto-activated:{id}`) para que cerrar y reabrir el menú del evento no volviera a centrar el mapa ni a prender las capas con `autoActivar=true`. La interacción con el editor (cambios de capas, redeploys, ediciones) podía dejar el flag obsoleto y bloquear la auto-activación de capas legítimas. Se elimina el `sessionStorage` y se vuelve al comportamiento original: cada apertura del menú dispara bbox-fit y auto-activa las capas marcadas. Si en el futuro se quiere reintroducir la persistencia, debe versionarse con un hash de las capas del evento o moverse a un toggle de configuración del usuario.

### Documentación
- `docs/cache.md`: removidas las filas de `evento:zoomed:*` y `evento:auto-activated:*` (ya no aplican).
- `docs/context.md`: actualizado el comportamiento de `<EventoMenu>` (sin persistencia).

## [1.20.1] - 2026-05-07

### Corregido
- **Swipe — preservar `defaultDate` al activar capas durante swipe**: `setLayerSlotMembership` ahora hereda opacidades y filtros del live state cuando la capa no está en ningún slot previo (antes el snapshot recién creado sobreescribía el filtro de fecha aplicado por `applyDefaultDate`, dejando rasters mensuales sin TIME activo).
- **Swipe — shape completo al deserializar**: `useShareSerializer`/`useShareDeserializer` arman `compareMode` partiendo de `initialCompareMode()` y reconstruyen `globalOrder` desde paneA+paneB. Así `exitCompareMode` siempre encuentra `originalSnapshot` y los reorden cross-slot conservan el orden del share.
- **Swipe — `reorderInSlots` aplica el snapshot al live**: el orden visual y el live state ya no divergen tras un drag entre slots.
- **Swipe — `useSymbology` reactivo a cambios de `compareMode`**: antes recibía un ref con identidad estable, así que el efecto que recalcula `selectedLayerForSymbology` no corría al cambiar membership de slots.

### Cambiado
- **Persistencia segura del comparador**: `helpers/swipeMode.js` agrega `safeStructuredClone` (con fallback `JSON.parse(JSON.stringify(...))`), `isValidStoredSnapshot` (validación de shape) y `SNAPSHOT_MAX_BYTES` (100 KB). `enterCompareMode` limpia el snapshot anterior antes de escribir uno nuevo, y solo escribe si el payload está bajo el límite. `useInitializeFromUrl` rechaza `sessionStorage` con tamaño mayor a 200 KB y valida `version`/`kind`/`payload` antes de invocar el deserializer.
- **Comparador — orientación persistida**: la orientación del swipe (`vertical`/`horizontal`) se guarda en `localStorage.mapalab.swipe.orientation` y se restaura al entrar a swipe. Antes siempre arrancaba en vertical.
- **Naming homologado**: `enterSwipeMode` → `enterCompareMode` (simétrico con `exitCompareMode`). El gesto táctil para descartar tarjetas del InfoBox `SwipeToRemove` se renombra a `DismissGesture` para evitar la colisión semántica con el modo comparador.
- **Tema visual centralizado**: nuevo `helpers/swipeTheme.js` con `SLOT_COLORS = { A, B }` y `SWIPE_HANDLE_COLOR`. `<SwipeView>`, `<SlotBadge>` y `swipeComposition.js` consumen del tema en lugar de literales `#5C2472`/`#FF8300`/`#F0EAF3`/`#FFF2E5` repartidos.
- **Helpers puros del comparador**: `purgePane`, `addIdsToPane`, `computeGlobalOrder`, `snapshotFromLive` extraídos a `helpers/swipeMode.js` (testables sin React). `useSwipeMode` queda como orquestador.
- **Constantes nombradas**: `SWIPE_POS_MIN/MAX`, `SWIPE_HANDLE_MIN/MAX`, `SWIPE_KEYBOARD_STEP`, `SWIPE_DEBOUNCE_MS`, `SWIPE_POS_THRESHOLD`, `SWIPE_POS_JITTER` reemplazan magic numbers en `<SwipeView>` y `useSwipeMode`.
- **Accesibilidad del comparador**: el handle del `<SwipeView>` pasa de `role="separator"` no-interactivo a `role="slider"` con `aria-label`, `tabIndex={0}` y soporte de teclado (←/→ vertical, ↑/↓ horizontal, paso 5%, `Home`/`End` para extremos). Overlays "A"/"B" gigantes marcados `aria-hidden="true"`. `<SlotBadge>` recibe `aria-label` con la oración completa del tooltip.

### Rendimiento
- **Swipe — mapas reactivos eliminan polling**: nuevo `paneMapInstances` (state) en `MapsContext` poblado por `<MapView>` cuando `useMapInitialization` retorna su instancia. `useViewSync` reescrito para reaccionar al state (antes hacía hasta 50 timeouts × 50 ms al entrar a swipe). `useScaleLineControl` detiene el `setInterval` (250 ms) en cuanto encuentra un map; el polling permanente cada 100 ms quedó eliminado.
- **`MapView` — `useMemo` del `paneSnapshot` con dep refinada**: ahora depende solo del pane relevante (`paneIndex === 0 ? paneA : paneB`); cambios en B ya no re-evalúan el memo del pane A y viceversa.
- **`SwipeView` — flag `externallySetRef`**: distingue cambios externos de `swipePosition` de cambios locales del drag para no re-emitir `setSwipePosition` en respuesta a un set externo.
- **`MapsProvider` — `liveStateRef` en `useLayoutEffect`**: la asignación queda comprometida después del render committed, segura con StrictMode/Concurrent. Antes se reasignaba en cuerpo del render.
- **`MapView` — cleanup de `paneMapRefs` valida identidad**: solo elimina la entrada si todavía es la propia, evitando que un mount nuevo durante StrictMode borre la entrada del segundo render.

### Documentación
- `docs/swipe.md` actualizado: nueva sección **Invariantes**, tabla de **Constantes**, sección **Accesibilidad**, descripción del par `paneMapRefs`/`paneMapInstances`, mención del `SNAPSHOT_MAX_BYTES`.
- `context.md` refleja la nueva arquitectura del comparador (helpers puros, theme, paneMapInstances, persistencia de orientación, naming `enterCompareMode`).

### Tests
- Nuevo `useSwipeMode.test.js` con 13 casos: enter/exit, ciclo `A → AB → B → A`, herencia de filtros desde live, reorden, set/clear filter por slot, visibility por slot, clamps de `setSwipePosition` y persistencia de orientación.

## [1.20.0] - 2026-05-07

### Agregado
- **`EventoContext` separado del `MapsContext`**: nuevo provider en `providers/EventoProvider.jsx` que envuelve los children dentro de `MapsProvider` y expone `{ eventos, loading, error, activeEvento, setActiveEvento, findEventoByLayerId, getLayerIdsByEvento }`. Hook de acceso `useEventoContext` en `hooks/useEvento.js`. Reduce el rerender del árbol del visor cuando cambia el evento activo o cuando llega refresh de eventos por el watcher de versiones. `MapsProvider` deja de exponer `activeEvento`/`setActiveEvento`; consumidores (`EventoMenu`, `LayerDetailModal`, `LayerDetailHeader`, `MapSider`) leen del nuevo contexto.
- **Persistencia por sesión de la apertura de evento**: `EventoMenu` ahora marca en `sessionStorage` (`evento:zoomed:{id}`, `evento:auto-activated:{id}`) que ya disparó el bbox-fit y la auto-activación de capas. Cerrar y reabrir el mismo evento dentro de la sesión ya no hace re-zoom ni vuelve a prender capas que el usuario haya apagado manualmente. Se resetea automáticamente al cerrar la pestaña.
- **Telemetría de eventos**: nuevos `evento_open` y `evento_close` (con `withMapInteraction`) en `analyticsService.js`; `EventoMenu` los dispara en mount/unmount con `evento_id` y `titulo` (sólo en open).

### Cambiado
- **`useEventos` ahora expone `{ eventos, loading, error }`**: contrato homologado con el resto de hooks de datos del proyecto. Inicial `loading=true` para que los consumidores puedan diferenciar "todavía no llegaron" de "no hay eventos".
- **`eventoHelpers` con index plano O(1)**: nueva `buildLayerIndex` aplana el árbol a un `Map` de claves `workspace|layer → node` y `buildEventoIndex` produce `{ eventoByLayerId, layerIdsByEvento }` reutilizable. `findLayerByWorkspaceLayer`, `getEventoLayerIds` y `findEventoByLayerId` siguen exportados pero ahora delegan al index. `LayerDetailHeader` usa el lookup centralizado en lugar de recorrer el árbol cada apertura del modal.
- **`ExternalEventoWidget` con item por evento aislado**: nuevo sub-componente interno `ExternalEventoItem` que tiene su propio `useMemo` por evento. Al togglear capas ya no se reconstruye el array completo de items: cada `MenuItem` recibe la misma referencia mientras su evento no cambie.
- **Polling de `cache-version` se pausa con la pestaña oculta**: `eventosService.startMapalabCacheVersionWatcher` ahora `clearInterval` en `visibilitychange→hidden` y reinicia con `setInterval` + `checkVersions` inmediato en `→visible`. Antes el `setInterval` seguía vivo aunque la pestaña no fuera visible.
- **Naming homologado en eventos**: `EventoIconButton` recibe `iconoUrl`, `imagenUrl`, `titulo` (alineado con la API). Se elimina el mapping inglés (`iconUrl`, `imageUrl`, `title`) en `ExternalEventoWidget` y `menuItems`. `LayerThemeAvatar` se mantiene genérico (`imageUrl`).
- **Tokens Tailwind para colores recurrentes de eventos**: nuevos `--color-purple-soft` (#F0E6F6), `--color-purple-deep` (#703088) y `--color-graphite` (#465055) en `index.css`. `EventoMenu`, `EventoIconButton` y `LayerDetailHeader` usan los tokens en lugar de literales `bg-[#...]`.
- **Imágenes de eventos con `loading="lazy" decoding="async"`** en `EventoIconButton` y `LayerThemeAvatar` para evitar bloqueo del render al abrir el sider.
- **Deps estables en `EventoMenu` para `setActiveEvento`**: en lugar de depender de la referencia del `Set` de `eventoLayerIds` (que cambiaba aunque el contenido fuera idéntico), se deriva una clave string ordenada (`Array.from(...).sort().join('|')`) y se usa esa como dep.

### Rendimiento
- **`EventoMenu` ya no causa re-set redundante del contexto** cuando se rebuilda el `Set` con el mismo contenido (gracias a la dep estable).
- **`LayerDetailHeader` con lookup O(1)** del evento por `selectedLayerId` (antes recorría todos los eventos × capas × árbol de capas en cada cambio).
- **`useEventos` y `useEventoLayerIndex` centralizados en el provider**: `MapSider` y `LayerDetailHeader` ya no llaman `useEventos()` por separado, comparten una sola suscripción a través del contexto.

### Documentación
- `context.md` actualizado con la nueva jerarquía de providers (`EventoProvider`), la sección de Modal de detalle ahora referencia `EventoContext` en lugar de `MapsContext`, y la lista de eventos de Analytics incluye `evento_open` / `evento_close`.
- `analytics.md` agrega filas para `evento_open` y `evento_close`.
- `cache.md` documenta las claves `evento:zoomed:*` y `evento:auto-activated:*` de sessionStorage y la pausa del watcher de versiones.

## [1.19.0] - 2026-05-06

### Agregado
- **Modal de detalle: identidad del evento**: cuando la capa abierta en `<LayerDetailModal>` pertenece a un evento (configurado en mariachi), el header reemplaza el avatar/título del tema por el ícono y nombre del evento. Prioriza el evento activo en el menú lateral; si el menú está cerrado (por refresh u otra navegación), recorre la lista de eventos y resuelve por la primera coincidencia. Nuevo `<LayerDetailHeader>`. `<LayerThemeAvatar>` extendido con prop `imageUrl`. `MapsContext` expone `activeEvento` (`{ id, titulo, iconoUrl, imagenUrl, layerIds }`) que `<EventoMenu>` setea/limpia mientras está montado. Helpers compartidos en `pages/maps/helpers/eventoHelpers.js` (`findLayerByWorkspaceLayer`, `getEventoLayerIds`, `findEventoByLayerId`); `<EventoMenu>` deja de duplicar la lógica.

## [1.18.1] - 2026-05-06

### Cambiado
- **Sidebar de mapas**: `createCategoryItems` ahora filtra los temas raíz con `hiddenInMenu=true`. Antes el filtro solo aplicaba a los hijos dentro de un tema, no a los temas mismos. Esto permite que mariachi cree temas-contenedor ocultos (como `eventos-auto`, padre de las capas auto-creadas para eventos) sin que aparezcan como botón de categoría en el sidebar; las capas siguen siendo encendibles desde el menú del evento o por la búsqueda global.

## [1.18.0] - 2026-05-06

### Agregado
- **Marker IIEG con stats dinámicas**: Muestra tarjetas con capas activas, registros totales y líneas de código. Estadísticas cargadas vía backend `/metadata/database-stats` con caché de 1h y asíncronas al click del logo. Soporte para el comparador en paneles swipe.
- **Loop controls visibles en panel**: Los controles de bucle temporal ahora son visibles directamente desde el panel de capas activas cuando `canPlayLoop` es verdadero, con nuevos layouts. Nuevo tamaño `lg` para DatePill y ajustes visuales en SlotBadge.
- **Mejoras SEO**: Etiqueta canonical, JSON-LD estructurado enriquecido (@graph con Organization, Place, WebSite), tags de verificación y noscript expandido en `index.html`. H1 ocultos por página con keywords en `Home.jsx` y `Maps.jsx`. `sitemap.xml` y `robots.txt` eliminados de la carpeta public (servidos por gateway).
- **Home UI**: El logo de Mapalab se muestra siempre extendido en móviles. Reorganización de columnas a una sola hasta el breakpoint `lg`.

### Cambiado
- **Fix Swipe**: El zoom, centrado, locate y clicks ahora activan correctamente el slot del pane correspondiente (A/B) utilizando `getActiveMap()`. Se introdujo `useViewSync` para compartir la vista de manera más eficiente entre paneles.
- **Refactor InfoBox**: Se removió el botón "Reportar" inline del InfoBox para limpiar la interfaz.

### Documentación
- `swipe.md` reescrito para clarificar el flujo de paneles.
- `periodicidad.md` actualizado incluyendo la lógica de backend y caché.
- `context.md` actualizado con ajustes de redacción leader-follower.

## [1.17.0] - 2026-05-04

### Agregado
- **MCP server montado en `/mcp`** del backend (expuesto al exterior bajo `/api/mcp/`). Construido con FastMCP a partir de un sub-app FastAPI que registra los routers `metadata`, `periodicity`, `layers` y `shares` (se excluyen `download` por su tamaño/streaming y `metrics` por ser interno de Prometheus). El `lifespan` del backend se compone con el de FastMCP via `combine_lifespans` para preservar el warmup del pool, el leader election y el scheduler. `nginx/nginx.conf` agrega `location /api/mcp/` con `proxy_buffering off`, `proxy_cache off` y timeouts de 600s para soportar el transporte HTTP streamable de MCP. Por ahora el endpoint queda público (mismo perfil que el resto del API); restringir a futuro vía gateway si se requiere.
- **`GET /ontoy`** en mapalab-backend: devuelve `{slug, label, version}` para que mariachi-admin pueda detectar la versión y healthy del backend desde el dashboard `/inicio`. La versión se lee de `app/__version__.py` (nuevo archivo) que se mantiene sincronizado con `frontend/package.json` al bumpear el repo. Convención del ecosistema IIEG: cada repo expone su `/ontoy` para que se descubra.
- **Sistema de reportes ciudadanos**: nuevo botón "Reportar" (icono `bug`) en cuatro puntos del visor — flotante junto a `MapAttribution`, inline en la columna de acciones del `InfoBox` cuando hay feature seleccionada (con `feature_id`/`layer_id`/`feature_properties` en el contexto), entrada en el `iconText` del marker IIEG (`action: 'report'`), e icono flotante en la esquina inferior derecha del footer de Home. Modal con tipo (problema/solicitud/sugerencia/duda/datos incorrectos/bug), mensaje (max 2000), email opcional (queda anónimo si se omite) y captura de pantalla opcional reutilizando `captureElement` de `useMapCapture` (`html2canvas-pro`, `scale: 0.7`). Honeypot oculto y rate limit del lado de mariachi. Los reportes viajan a `POST /api/public/reportes` de mariachi y se administran desde la nueva sección "Reportes" del admin.
- **`useReportContext` + `feedbackService`**: hook que arma `source_app`/`source_route`/`source_context` (app_version, user_agent, screen, basemap, capas activas, vista del mapa, swipe) y servicio que postea como `multipart/form-data` con manejo de 429 (`code: 'rate_limited'`).
- **Evento de analytics `report_submitted`** con `tipo` y `source_route`.
- **Icono `bug`** inline en `Icon.jsx`.
- **Proxy `/api/public` → mariachi en Vite** (dev): nueva regla en `vite.config.js` para rutear el endpoint público de reportes al `MARIACHI_DEV_TARGET` (mismo target que `/api/mapalab`).

## [1.16.0] - 2026-05-04

### Agregado — Acciones del item activo y mejoras al swipe
- **`<CloseButton>` reutilizable** (`@components/CloseButton`): extraído del antiguo `MeasurementTools/CloseButton`. Acepta `tooltip`, `confirmTitle`, `confirmDescription`, `confirmText`, `confirmPlacement` (`top`/`bottom`), `confirmClassName`, `size`, `iconSize`. Mantiene los estilos rosa/cerrar (`bg-[#FFE6EC]` → `bg-[#FF577D]` activo) y el `<ConfirmDropdown>` de aviso. Lo usan ahora `MeasurementTools/ToolsPanel` y `SwipeSlotControls`.
- **`<ConfirmDropdown>` con prop `placement`** (`top` | `bottom`, default `bottom`): permite que el dropdown se abra hacia arriba para botones que viven al pie de la pantalla (e.g. el cerrar del comparador).
- **Botón Descargar inline en panel de capas activas** (`<LayerActionsBar>`): junto al de opacidad. Click abre el `<DownloadMenu>` existente (mismo flujo que el modal de detalles, no descarga directa). Durante descarga muestra un spinner y permite cancelar. Sólo aparece si `metadata.capa_descargable !== false`. Reutiliza `useLayerMetadata`, `useLayerDownload` y `<DownloadMenu>`. Sólo carga metadata cuando el item está expandido.
- **Spinner Lottie en leyenda inline** (`<LayerLegendInline>`): mientras la imagen WMS GetLegendGraphic carga, se muestra el `<Logo name="mapalab" isLoading />` (mismo Lottie del modal de detalles). El contenedor sólo aplica `min-h-[40px]` mientras `!isLoaded`; al cargar la imagen toma altura `auto`.
- **Tooltips dinámicos por slot en swipe** (`<LayerActionsBar>` y `<LayerInlineActions>`): visible/ocultar/opacidad/descargar/leyendas anexan `del lado A` o `del lado B` según `slotMembership`. Para acciones destructivas en `AB` (ocultar) se agrega `(seguirá en el lado X)`.
- **`globalOrder` en `compareMode`**: nuevo array que dicta el orden de la unión `paneA + paneB` en `effectiveActiveLayerIds`. `setLayerSlotMembership` lo extiende con IDs nuevos al final, `removeLayerFromSlot` lo limpia, `reorderInSlots` lo sobreescribe. Permite reordenar items en swipe aunque las capas estén en slots distintos (antes la unión siempre concatenaba paneA primero y el reorden cross-slot se "regresaba").
- **`reorderInSlots(newGlobalOrder)`** en `useSwipeMode`: actualiza `paneA.activeLayerIds`, `paneB.activeLayerIds` (preservando solo los IDs que cada pane tiene en el nuevo orden) y `globalOrder`. `ActiveLayersList` lo usa via `handleReorder` cuando `compareMode.active`.

### Cambiado
- **Botón Cerrar del comparador** (`<SwipeSlotControls>`): ahora es un `<CloseButton>` separado. Si hay periodicidad seleccionada (`showA || showB`) sale arriba de la barra, alineado verticalmente con el botón de orientación; si no hay periodicidad, queda dentro de la barra a un lado del orientation. Confirma el cierre con dropdown `(¿Cerrar la comparación? Se descartará la comparación actual y volverás al estado original del mapa.)`.
- **Layout de la barra de acciones del comparador**: vuelve a `flex` simple cuando hay date pills, dejando que el `bg-white rounded-full` se ajuste al contenido. `<DatePill>` acepta `autoWidth` para que en este contexto los pills no apliquen ancho fijo (el ancho fijo sigue activo en el panel de capas activas para evitar saltos durante loops).
- **Estado activo del botón de leyendas** (`<LayerActionsBar>`): cuando `legendsVisible=true` el botón usa `bg-white border border-[#70308A]` (estilo discreto tipo "selected", consistente con el botón Copiar) en vez del estilo `BUTTON_BASE` con fondo `#F9FBFF`. La flecha sigue morada.
- **Botón Eliminar en swipe**: ahora siempre quita la capa de **ambos** slots (`paneA` y `paneB`). Para mover entre lados se usa la pildora A|B; el botón eliminar es para sacar la capa por completo del comparador. Tooltip vuelve a `"Eliminar capa"` simple.
- **`useWMSLegend` resuelve hijos de grupos**: nuevo helper interno `resolveWMSId(layer)` que si el `layer.id` no tiene `wmsConfig` propio busca en `layer.childIds` el primer descendiente con WMS. Aplica a `hasLegend`, `getLegendUrl` y `getLegendJson`. Antes el botón de leyendas no aparecía para grupos `forceGroup` cuando el panel mostraba el ancestor sin WMS propio.
- **`useActiveLayersLogic.visible` y `useSymbology.toggleLayerVisibility` consideran children activos**: el cálculo de visibilidad de un grupo `forceGroup` considera los hijos que están en `activeLayerIds` (no todos los descendientes del árbol). El toggle detecta correctamente el estado "currently hidden" para evitar que después de un restore con sólo los hijos en `hiddenLayerIds` el click invertido oculte todo en lugar de mostrar.
- **`ScaleLineControl` funciona en swipe**: `useScaleLineControl` ahora recibe un getter `getMapInstance` y polea cambios cada 100ms. En swipe usa `paneMapRefs.current[0].current` (paneA — los dos mapas están sincronizados via `useViewSync`); fuera de swipe usa `ctx.mapRef.current`. Cuando cambia, remueve el `ScaleLine` del mapa anterior (try/catch por si fue destruido) y lo añade al nuevo.
- **Badges del header del panel de capas activas** ahora cuentan items unificados (`unifiedLayers.length`) en lugar de IDs internos. Antes activar una capa de un grupo `forceGroup` con 3 hijos mostraba `4` en los badges aunque visualmente sólo había 1 item en el panel.

### Corregido
- **Periodicidad no se mostraba en el modal de detalles para la primera capa activada**: `useLayerPeriodicity` ahora dispara fetch on-demand vía `ensureFetched(layerId)` cuando el modal abre con un `layerId`, sin depender del `useEffect` global de `activeLayerIds`. Si el fetch falla se quita del `fetchedRef` para permitir reintentos.
- **Bug del ciclo `A → AB → B → A` deseleccionaba el item del panel**: `useSymbology` ahora considera la unión `paneA + paneB` (vía `compareModeRef`) además del live state al validar `stillActive` y al construir candidatos para fallback. Antes el live state perdía la capa al cambiar de slot y el effect deseleccionaba aunque la capa siguiera en el otro pane.
- **Visibilidad y opacidad no se persistían entre refrescos para grupos `forceGroup`**: el `useEffect` cleanup de `useLayerOpacity` corría en mount con `activeLayerIds=[]` y encolaba un updater functional con closure stale. React procesaba el `setLayerOpacities(new Map(...))` del deserialize antes que el updater stale, que veía `prev={4 entries}` y filtraba contra `allActiveIds=[]` borrando todo. Fix: el cleanup-effect skip cuando `activeLayerIds` está vacío. Para visibilidad, `useActiveLayersLogic` y `useSymbology.toggleLayerVisibility` ahora usan `activeChildIds` (children que están en `activeLayerIds`) en lugar de todos los descendientes del árbol.
- **`slotMembership` no detectaba grupos `forceGroup`** cuando el `layer.id` era el ancestor pero los IDs reales en `paneA`/`paneB` eran los hijos. Ahora valida contra `[layer.id, ...layer.childIds]`. Esto destrabó el botón eliminar y los tooltips dinámicos en swipe para grupos.
- **Modal de descarga (`DownloadMenu`) activaba el tooltip warning del item**: el `<Tooltip>` de "Al seleccionar un punto..." ahora se deshabilita mientras `download.menuOpen=true`.
- **`SymbologyPanel` viejo deshabilitado** con flag `SYMBOLOGY_PANEL_ENABLED = false` en `MapLayersPanels.jsx` (archivo y código intactos para reactivar después).

## [1.14.0] - 2026-04-30

### Agregado — Item de capa activa rediseñado a layout vertical
- **`<ActiveLayerItem>` reorganizado en filas verticales** (sin más despliegue lateral en hover desktop): Fila 1 con drag handle (solo en seleccionado o hover) + título; Fila 2 con periodicidad + loop + `<SlotBadge>` centrado matemáticamente al medio del item via CSS Grid `grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]`; Fila 3 con barra de acciones; Fila 4 con leyenda WMS inline. Las filas 2-4 sólo aparecen cuando el item está seleccionado; en hover de no-activo siguen apareciendo los botones inline a un lado del título (`<LayerInlineActions>`).
- **Sub-componentes nuevos** en `ActiveLayers/`: `LayerActionsBar`, `LayerInlineActions`, `LayerLegendInline`, `LayerOpacityPopover`. `LayerItemHeader` se separó en `DragHandle` + `LayerTitle` para permitir reordenar elementos en el header.
- **Botón de opacidad inline** (`<LayerActionsBar>`): por defecto muestra el icono `opacity` (SVG inline nuevo en `Icon.jsx`); cuando la opacidad ≠ 100 % muestra el porcentaje (`75%`, `40%`, etc.). Click abre `<LayerOpacityPopover>` (portal a `document.body` + `position: fixed` calculado desde `getBoundingClientRect()` del botón) que envuelve el slider `<Bar>` reusado del `OpacityControl`. Click outside, Escape o cambio de scroll cierran/reposicionan.
- **Leyenda WMS inline** (`<LayerLegendInline>`): GetLegendGraphic lazy (sólo se monta el `<img>` cuando el item está expandido). Wrapper `bg-white rounded-[10px] shadow` replica las dimensiones del `<SymbologyPanel>` y la imagen va a `dpi: 200` para nitidez retina, limitada visualmente con `max-w-[220px]`. En swipe AB respeta el `activeSlot` (una sola leyenda con el filtro del slot que estás editando).
- **Toggle global "Mostrar/ocultar leyendas"** persistido en `localStorage` (`mapalab.activeLayers.legendsVisible`, default `true`). Hook + provider `useLegendsVisibility` viven en `ActiveLayers/hooks/`. El botón está dentro de `<LayerActionsBar>` por capa (sólo aparece si la capa tiene leyenda WMS): icono `simbologia` cuando off, `upArrow` cuando on. Para el icono off agregamos `ico_simbologia_gray.svg` con el gris `#465055` (mismo que el resto de iconos `*_gray`).
- **Highlight de slot al cambiar `activeSlot` desde el `<Switch>` A-B**: en `<LayerActionsBar>`, click en el switch llama `setHighlightedSlots(target)` y un `setTimeout(() => setHighlightedSlots(null), 1500)` para destacar el panel correspondiente del swipe sin necesidad de hover.

### Cambiado
- **Loop controls sólo visibles cuando `isLooping`** (panel de capas activas): los botones de play/intervalo/dirección dentro del item ya no aparecen como invitación a iniciar el loop. Para arrancar el loop, se usa el "VER ANIMACIÓN" del `<LayerDetailModal>`. Una vez corriendo, los controles aparecen en el panel para pausar/ajustar.
- **`<Tooltip>` global** acepta nuevas props opcionales `triggerBlock` (cambia el wrapper de `inline-flex` a `block`) y `triggerClassName` para que el contenedor pueda expandirse al ancho del padre. Se usa en el warning del item activo (`triggerBlock + w-full`) para que las filas 2-4 ocupen todo el ancho del item.
- **`useWMSLegend.getLegendUrl`** acepta `dateValue` opcional para sobreescribir el filter de fecha; si no se pasa, sigue usando `getFilter(layerId)` (compatible con todos los consumidores existentes).
- **Swipe Intro: modal → tooltip enriquecido**: la info clave (slots vacíos, capas se guardan, agregar una por una) ahora vive en el tooltip del botón "Barra divisora" del `<ToolsMenu>`. Click directo entra a swipe sin paso intermedio.

### Corregido
- **`<SlotBadge>` tooltip atorado al ciclar membership**: agregado `key={membership}` al `<Tooltip>` interno y removido `e.stopPropagation()` de los handlers de mouseEnter/mouseLeave del button — el `<Tooltip>` se desmonta y vuelve a montar al cambiar A → AB → B y el `mouseLeave` del wrapper del Tooltip ya recibe los eventos correctamente.
- **Item activo se "encogía" al ser seleccionado**: el `<Tooltip>` warning del item envolvía el contenido en `display: inline-flex` y colapsaba el ancho. Resuelto con la prop `triggerBlock` nueva.

### Eliminado
- `frontend/src/pages/maps/components/SwipeIntroModal.jsx` y `frontend/src/pages/maps/helpers/swipeIntroStorage.js` — la info pasó al tooltip del `<ToolsMenu>`.
- `frontend/src/pages/maps/components/SwipeSlotFlash.jsx` — el flash centrado tipo "círculo morado/naranja con A o B" al cambiar `activeSlot`. Se reemplaza por el highlight del overlay del panel correspondiente (mucho menos invasivo).

## [1.13.1] - 2026-04-28

### Agregado
- **Click en label de padre activa/desactiva todos los hijos** (`<LayerItem>`): antes el click en el texto del nodo padre solo expandía/colapsaba — el toggle del subárbol estaba escondido detrás del `<Switch>` lateral. Ahora el click en label calcula `isOn = activeLayerIds.includes(layer.id) || allChildrenActive` (la misma señal que ya usaba el switch), llama `onToggle(layer.id, !isOn)` y se apoya en la propagación recursiva existente de `useLayerToggle.handleToggleLayer` (líneas 117-129) que añade/quita `[layerId, ...getAllChildLayerIds(layerId)]`. Si el resultado es activar, fuerza `setIsManuallyExpanded(true)` para que el subárbol quede abierto y se vean los checks marcados; si es desactivar, respeta la expansión actual. Hojas (sin hijos) no cambian. El switch lateral queda intacto.

### Cambiado
- `renderCard.jsx`: refactor del cuerpo del infobox para soportar `blockOrder` (opcional, persistido en `infobox_config`). Cada bloque body (`labels`, `labelGroups`, `list`, `iconText`, `text`, `cards`) extraído a su propia función pura. Si el config trae `blockOrder` con keys válidas, se usa ese orden + remaining defaults al final. Si no trae `blockOrder`, mantiene el orden hardcoded actual (backwards-compatible — los 250 configs existentes siguen renderizando idénticos).

## [1.13.0] - 2026-04-27

### Agregado — Comparador Fase 3
- **`<CompareView>` (split lado-a-lado)**: dos `<MapView>` independientes con sus propios `mapRef`/`targetRef` locales. Header por panel con la etiqueta de la fecha. Layout `flex` 50/50 con borde divisor blanco.
- **`<SwipeView>` (barra divisora)**: dos `<MapView>` superpuestos, el de la derecha con `clip-path: inset(0 0 0 ${pos}%)`. Barra naranja vertical draggable (rango 5%–95%) con handle circular, posicion persistida via debounce 200ms. Cursor `ew-resize`, `touch-none` para mobile. Pan/zoom sincronizados.
- **`useViewSync(paneMapRefs, active)`**: engancha listeners `change:center`/`change:resolution`/`change:rotation` en ambos `View` de OL con flag anti-loop. Polling de mount con backoff hasta que ambos `mapRef.current` estén poblados.
- **`useDateOverride` via `dateOverride` prop**: `<MapView paneIndex dateOverride>` propaga el valor al `useWMSFilterUpdater`, que lo usa como `TIME` en lugar de `getFilter(sub.id)` para capas con `wmsConfig.timeEnabled`. Capas vectoriales con CQL `date` quedan fuera de scope v1 (renderizan idénticas en ambos lados).
- **`<CompareDateModal>`**: dos `<input type="date">` + etiquetas opcionales ("Antes"/"Después"). Validación YYYY-MM-DD + dos fechas distintas. Acepta prop `layout: 'split' | 'swipe'` para diferenciar el flujo.
- **`compareMode` en `MapsProvider`**: `{ active, axis: 'date', panes, layout, swipePosition }`. Setter `setCompareMode`, `exitCompareMode`, `setSwipePosition` (debounced en SwipeView). `paneMapRefs` registry indexado por `paneIndex` para que `useViewSync` acceda a cada `Map`.

### Agregado — Submenu de Herramientas
- **Reorganizacion del item `tools`** en el sider de `hasMenu: false` con `onClick: toggleMeasurementTools` directo a `hasMenu: true` con `<ToolsMenu>` como `menuContent`.
- **`<ToolsMenu>`**: grid 2x2 de tres iconos en el patron de `<BaseMapList>`: **Mediciones** (dispara el toggle existente que abre `<MeasurementTools>`), **Comparar fechas** (abre `CompareDateModal` con `layout='split'`), **Barra divisora** (abre `CompareDateModal` con `layout='swipe'`). Estado activo por icono: Mediciones se muestra activo si `areMeasurementToolsVisible`; Comparar/Swipe segun `compareMode.layout`.
- **Iconos SVG inline**: una regla con punto para Mediciones, dos paneles juntos para Comparar fechas, mapa con linea naranja vertical y flechas para Swipe. Estilo por hover/active siguiendo el patron del basemap.

### Agregado — Persistencia compartida del comparador
- **`kind: 'swipe'`** en serializer/deserializer: estructura igual a `kind: 'compare'` pero con `payload.position` (0..1). Bumpea share, recarga estado completo (capas + filtros + fechas + posicion del divisor) al abrir el link.
- **`kind: 'compare'`** ya soportado: hidrata `compareMode` con `axis` + `panes` desde el envelope. Default `layout: 'split'` cuando no viene. Tests actualizados (`useShareDeserializer.test.js`, nuevo `useShareSerializer.test.js`).

### Agregado — URL viva limpia + persistencia local
- **Refactor URL strategy**: removidos `useUrlSync`, `useMapViewUrlSync` y test asociado. La URL viva ya no muta con cada cambio de capa/filtro. Solo se modifica al pulsar "Compartir": queda `?s=<hash>`. Deeplinks por capa via `?layer=<slug>` siguen funcionando para invitar a una capa unica.
- **`useSessionPersistence`**: serializa el estado actual (mismo envelope que el share) a `sessionStorage` con debounce. Sobrevive un refresh, se pierde al cerrar la pestaña. `hasBeenPopulatedRef` evita borrar el storage durante el primer mount cuando aun no hay capas cargadas (corner case que perdia el estado previo).
- **`useInitializeFromUrl`**: orden de precedencia `?s=` → `?layer=` → `?layers=` (legacy) → sessionStorage → `BASE_INITIAL_ORDER`. Valida `layers.length > 0` antes de deserializar el sessionStorage para que un envelope vacio caiga al fallback.

### Agregado — Indicadores de estado del share
- **`useShareDirtiness`**: detecta si el estado vivo divergio del share cargado. Trackea `activeLayerIds`, `filters`, `layerOpacities`, `hiddenLayerIds`, `selectedLayerForSymbology`, `baseMapId`. **No** rastrea pan/zoom (decision: el share guarda el encuadre como starting view, no como invariante; explorar zonas vecinas no debe marcar dirty).
- **Badge "Usando link compartido: hash"** (verde, no interactivo) en `<MapToolsPanel>` cuando `inSyncWithShare`.
- **Boton "Regresar a: hash"** (gris, clickeable, hace `window.location.reload()`) cuando el estado fue modificado tras cargar el link.
- **Badge "Comparando: A vs B ×"** (azul) en compare mode, click sale.
- **`<ShareButton>` con tres estados**: verde claro + icono `done` cuando sincronizado, gris cuando modificado, lavanda/morado normal. SVG `done` usa `currentColor` para que el check tome el color del texto.

### Cambiado — InfoBox y feature info
- **Filter por id en `useFeatureInfo.handleRemoveFeature`**: cuando se borra una card del cluster, el `cachedFeatures` se filtra por id (con fallback a referencia). Counter pasa de `1/482` → `1/481` y el download CSV refleja el set actual.
- **Re-poblacion al borrar la ultima visible**: si la cache aun tiene items, se restauran `features` con un slice — antes destruia el resultEntry y la card desaparecia con cache disponible.
- **`useLoadMoreFeatures` recibe `selectedFeatureInfo` por argumento** en lugar de leer state via setter. Test nuevo (`useLoadMoreFeatures.test.js`).
- **`useDateLoop` no pisa filtros del share**: chequea `getSpecificFilter(layerId, 'date')` antes del default-date apply, skipea si ya hay filtro (tipico de share-loaded).

### Eliminado
- `frontend/src/pages/maps/components/CompareButton.jsx`: el scaffold de v1.10.0 ya no se usa, su funcionalidad vive en `<ToolsMenu>`.
- `frontend/src/pages/maps/hooks/useUrlSync.js`, `useMapViewUrlSync.js`: reemplazados por inicializacion via `?s=`/`?layer=` + `useSessionPersistence`.
- `frontend/src/services/featureInfoPagination.js`: doble-fetch WMS + cache local hizo innecesaria la paginacion WFS.
- `frontend/src/test/pages/maps/hooks/useUrlSync.test.js`: cubria los hooks borrados.

### Corregido
- **EPSG:3857 vs WGS84 en serializer**: `view.getCenter()` devuelve coordenadas en `EPSG:3857`. El serializer las pasaba directo y el deserializer hacia `fromLonLat([lon, lat])` asumiendo WGS84 → centro del mapa al espacio sideral, OL retry-loop infinito al abrir el share. Fix: `toLonLat(center)` en el serializer.
- **`selectedLayerForSymbology` en serializer**: leia `selectedLayer` (modal) en lugar de `selectedLayerForSymbology` (sider). El deserializer setea el segundo, asi que round-trip no respetaba la simbología.
- **`Modal isOpen vs open`**: `<ShareModal>` pasaba `open={open}` cuando `<Modal>` espera `isOpen`. El modal nunca aparecia visiblemente.

### Backend
- `backend/app/routers/shares.py`: ajustes menores en validacion del envelope.
- `backend/app/services/layer_tree_service.py`: pequeño tweak.

## [1.11.0] - 2026-04-26

### Agregado
- **Lazy load infinito en InfoBox** (caso click multi-feature): muestra 50 cards inicial y carga 50 mas conforme scrolleas hasta el fondo. Implementado con `IntersectionObserver` que auto-detecta el contenedor scrolleable ancestro (`overflow-y: auto/scroll`), funciona idéntico en mobile (dentro de `MobileSheet`/`ScrollContainer`) y desktop (dentro del nuevo `ScrollContainer` que reemplazo al `<div max-h-[60vh]>` plano).
- **Total real desde el primer click**: doble fetch WMS GetFeatureInfo en paralelo — el primero con `FEATURE_COUNT=50` para paint inicial rápido, el segundo con `FEATURE_COUNT=2000` para conocer el total real. El segundo se cachea localmente (`cachedFeatures`) y lazy load slicea desde memoria — cero requests adicionales al scrollear. Reemplaza el intento previo de WFS `resultType=hits` que era frágil (CORS/version mismatches en algunos GeoServers).
- **Counter por card con total real**: cada card muestra `1/482` directo en lugar de `1/50` del display cap. El total refleja todos los features del cluster, no los visibles.
- **Decremento al eliminar card con X**: `handleRemoveFeature` ahora filtra del `cachedFeatures` (por referencia + fallback por id), bajando `totalAvailable`. Counter pasa de `1/482` → `1/481` y el download CSV ya no incluye el eliminado.
- **Badge de count en botón Descargar (desktop)**: pill naranja en bottom-right del botón con el total real (ej. `482`). Tooltip muestra "Descargar 482 de 482 tarjetas". Para clusters > 2000 muestra `2000+`.
- **`ScrollContainer` propagado a desktop**: el InfoBox de desktop ahora usa el mismo `<ScrollContainer>` que mobile (con flechas, fade, click-arrows). Cuando hay 1 sola card, render plano sin scroll.
- **Header del card con título centrado siempre**: counter y X cambian a `position: absolute` (top-left y top-right). El `<h3>` toma `w-full` con `text-center` y se centra respecto al header completo, sin importar el ancho del counter (ej. `999/9999` ya no comprime el título). Padding lateral `px-12` reserva espacio para los flotantes; `my-3` separa título verticalmente del counter+X.

### Cambiado
- **`FEATURE_COUNT_CAP`**: 50 (display inicial). El counter muestra el total real desde el primer paint, así no necesitamos cargar 200 desde el inicio.
- **`FEATURE_COUNT_TOTAL`**: 2000 (cap del segundo fetch en paralelo, fuente de `cachedFeatures` y `totalAvailable`).
- **`enrichResultsForDownload`** consume directo del `cachedFeatures` (cap 5000) — antes paginaba via WFS GetFeature, ahora slicing local instantáneo.
- **`useFeatureInfo`** crea `features` como `cachedFeatures.slice(0, visible)` para garantizar que ambos arrays compartan referencias (fix de bug donde el filter por id no decrementaba el total porque las dos fetches devolvían objetos distintos).

### Corregido
- **LayerDetailModal: tema y avatar correctos** — el campo `tema` derivado del backend (`layer_name_usuario.split(':')[0]`) no funciona con la migración v1.4.0 si el formato `Tema:Nombre` ya no se respeta. Fix: nuevo helper `findLayerTheme(layerId, layerTree)` en `wmsConfig.js` que recorre el árbol y devuelve el ancestro `nodeType: 'tema'`. `LayerDetailModal` ahora prefiere ese valor (con fallback a `metadata.tema` y `'General'`). El avatar e icono se resuelven automáticamente.
- **mariachi admin: redirect 401 ya no manda a `/administrador/login`** (path legacy roto post-v0.21.0). `api.js` usa `import.meta.env.BASE_URL` para construir el URL → `${BASE_URL}/administrador/login` con basename `/mariachi/`.

### Arquitectura interna (no visible al usuario)
- **`useInfoBoxLazyLoad`** (nuevo hook): encapsula `IntersectionObserver`, totales agregados, contexto de carga y `enrichResultsForDownload`. Auto-detecta scroll root ancestor para que el observer funcione en cualquier wrapper.
- **`useLoadMoreFeatures`** (nuevo hook): mutador puro de `selectedFeatureInfo.results` que extiende `features` slicing del `cachedFeatures` (sin red, instantáneo).
- **`featureInfoPagination.js`**: helpers WFS para `fetchTotalsForClick` (legacy WFS hits, ya no usado en main flow) y `fetchMoreFeaturesForLayer` (paginación WFS por si en el futuro se quiere fetch incremental real).
- **eslint override** para `InfoBox.jsx` con `max-lines: 400` siguiendo el patrón existente de `useMapDrawing.js`.

## [1.10.0] - 2026-04-24

### Agregado
- **Componente `<Tag>`** (`@components/Tag`) para etiquetas semanticas: `state` = `beta` | `dev` | `nueva` | `test`, `size` = `xs` | `sm` | `md`. Estilos por estado.
- **Componente `<CompareButton>`** con tag BETA: scaffold visual del comparador por fecha. Hoy se monta `disabled` dentro de `<ShareModal>` como teaser; la funcionalidad de split-view + `useDateOverride(paneIndex)` viene en una version posterior.

## [1.9.0] - 2026-04-24

### Agregado
- **Snapshots persistidos del mapa** (`mapalab.map_shares`): `POST /shares` guarda el estado completo (capas, orden, visibilidad, opacidad, filtros, periodicidad, loop, basemap, vista) en DB y devuelve un hash corto. `GET /shares/{id}` lo restaura. URL: `?s=k3jx9p2m`.
- **Pinning de shares por 1 ano** (`POST /shares/{id}/pin`). Default: retencion sliding window 30 dias desde ultimo acceso.
- **Modal "Compartir mapa"**: reemplaza al `ShareButton` legacy. Crear enlace, copiar, fijar 1 ano. Detecta `?s=hash` en `useInitializeFromUrl` y restaura el estado completo al cargar.
- **Hash determinista** (SHA-256 del JSON canonicalizado, base32 truncado a 10 chars): dos usuarios que arman el mismo mapa comparten el mismo hash → deduplicacion automatica.
- **Rate limiting in-memory** en `POST /shares` (10 req/min por IP-hash) + tamano max payload 64KB.
- **Métricas Prometheus** nuevas en `/metrics`: `mapalab_shares_created_total{kind}`, `mapalab_shares_accessed_total{kind}`, `mapalab_shares_pinned_total`. `incr()` ahora soporta labels.
- **Cron diario `run_cleanup_shares.py`** (04:45 en `dataengine-jobs`): elimina shares no-pinned con `last_accessed_at > 30 dias` y pinned-expirados.
- **Migracion Alembic 0005** en `mapalab-dataengine/jobs/alembic/versions/`: tabla `mapalab.map_shares` con índices condicionales (sliding-window y pinned).

### Cambiado
- **`ShareButton`**: ya no copia el URL viva al portapapeles; ahora abre el `<ShareModal>` que mintea un share persistente. El componente `helpers/handleShare.jsx` legacy se elimina.

## [1.8.0] - 2026-04-24

### Agregado
- **Slugs publicos por capa** (`mapalab.layers.slug`): identificadores legibles tipo `establecimientos-salud` que reemplazan los IDs internos de GeoServer en URLs publicas. Configurables desde mariachi admin con auto-suggest desde el label.
- **Aliases de capa** (`mapalab.layer_aliases`): atajos cortos opcionales (ej: `esalud`) que tambien resuelven a la capa. CRUD via `GET/POST/DELETE /layers/{id}/aliases` en mariachi y nueva tab "Aliases" en `LayerEditPage`.
- **Endpoint `/layers/resolve?ref=<slug-or-alias>`** en mapalab backend para resolucion publica.
- **Deeplink por capa** via `?layer=<slug>`: aterriza con esa capa unica activa + su `defaultDate`.
- **URL viva con slugs** en lugar de IDs: `useUrlSync` y `useInitializeFromUrl` operan en slugs con fallback automatico a id legacy durante 2 releases.
- **Migracion Alembic 0004** en `mapalab-dataengine/jobs/alembic/versions/`: slug + aliases.

### Cambiado
- **Ownership de migraciones del schema `mapalab.*`** revisado (ecosystem.md §7.3 v2): movido de mariachi a mapalab-dataengine. Razon: en prod mariachi y dataengine corren en servidores distintos. Ahora `make prod-migration` y `make migrate` aplican migraciones desde el container `dataengine-jobs` sin depender de mariachi.
- **`bootstrap-v14.sh`** corre `alembic upgrade head` automaticamente al final del bootstrap (idempotente; aplica solo lo nuevo si ya estaba stamped).
- **`prod-migration.sh`** ahora idempotente y re-ejecutable. Default cambia a `--skip-etl` (ETL legacy del Sheet desactivado); para incluirlo `--with-etl` opcional.
- **Container `dataengine-jobs`** incluye `alembic==1.13.3` en sus deps.
- **Targets `make migrate` y `make migrate-status`** en `mapalab-dataengine/Makefile`.
- **`run_refresh_layer_tree.py`**: incluye `slug` y `aliases` en cada nodo del JSON cacheado.
- **Mariachi**: removida la rama `dataengine` de su Alembic (`alembic.ini`, `env.py`, `versions/dataengine/`); `init_db.py` ya no la invoca. Mariachi solo gestiona schema `public.*`/`mariachi.*`.

### Corregido
- `layer_tree_service.get_cached_state()` revalida contra DB via etag check en cada llamada. Cierra la ventana de staleness cross-workers: cuando mariachi (o el cron nocturno) actualiza `mapalab.layer_tree_cache`, los N workers Gunicorn se autosincronizan en su siguiente request sin necesidad de restart ni pub/sub.
- `.env.development`: `DB_HOST=localhost` → `host.docker.internal` para que el backend en container alcance el Postgres de dataengine.

### Documentacion
- `docs/context.md`, `docs/layers.md`, `docs/runbook-layers.md` actualizados para reflejar `make prod-migration` como entrypoint unico de bootstrap en dataengine.
- `docs/planes/PLAN_URL_SHARES_SLUGS.md` agregado: plan completo del feature (slugs + aliases + shares + comparador).
- `mariachi/docs/ALEMBIC_MULTI_ENV.md`: reescrito como single-env con pointer a mapalab-dataengine.
- `gateway-hub/docs/ecosystem.md §7.3` revisado con la nueva politica de ownership de schema.

## [1.7.0] - 2026-04-22

### Agregado
- **Drag & drop de reorden** en el árbol del editor (Ant Design `Tree.draggable`). Solo admin, solo entre hermanos del mismo padre. Llama `PATCH /layers/reorder` y recarga
- **Preview InfoBox con datos dummy** en el drawer: muestra `headerField`, badges (municipio / característica), listas, iconText, stats y texto adicional según el preset seleccionado
- **Formularios dinámicos por preset InfoBox**: `municipio`, `punto`, `punto_municipio`, `punto_ubicacion`, `punto_completo` exponen sólo los campos que aplican. `caracteristicas`, `list`, `iconTexts` usan `Select mode="tags"`
- **Editor JSON para `infobox_config` custom**: textarea monospace + validación en vivo + remount por `key={layer.id}` para evitar contaminación entre capas
- **Endpoint `/metrics` Prometheus** en mariachi (`app/api/metrics.py`) con contadores in-memory: `mariachi_rate_limit_hits_total`, `mariachi_tree_notify_total`, `mariachi_geoserver_calls_total`. Formato `text/plain; version=0.0.4`. Sin deps nuevas (defaultdict + threading.Lock)
- **Endpoint `/metrics` Prometheus** en mapalab backend (`app/metrics.py`): `mapalab_tree_requests_total`, `mapalab_tree_cache_hits_total`, `mapalab_tree_refresh_total`, `mapalab_search_requests_total`, `mapalab_download_requests_total`
- **Integración huachicol**: `MARIACHI_BACKEND_TARGET` en `.env.example` y `scripts/generate-targets.sh`. `docs/agregar-proyecto.md` actualizado
- **Code-split admin mariachi**: `React.lazy()` + `Suspense` en `Users`, `MenuManager`, `PageEditor`, `Media`, `RevisionQueue`, `MapalabLayers`. Chunks separados por página (MapalabLayers: 43 kB gzip 15 kB). Bundle inicial ya no carga editor rico ni tree
- **Tests integración cruzada mariachi → mapalab** (`test_integration_notify.py`): notifier skip sin URL, POST correcto con mock transport, debounce consolida 5 calls en 1, /metrics Prometheus format, thread-safety del contador (10 threads × 1000 incr = 10_000)
- **Documentación de API de Taiga**: Agregada la guía `docs/taiga.md` con referencias de autenticación y flujos automatizados en Bash/Python para proyectos, épicas, historias, tareas y Wiki.
- **Tests `/metrics`** en mapalab (`test_smoke.py::TestMetrics`): response plaintext, increment en `/layers/tree`, increment de cache hits en 304

### Cambiado
- `useLayerTreeAdmin` expone `reorderLayers(parentId, orderedIds)`
- `LayerEditDrawer` usa `Form.useWatch` en `workspaceAlias` / `geoserverLayer` / `infoboxTemplate` / `infoboxParams` / `infoboxConfig` (elimina state paralelo)

### Eliminado / Deuda legacy
- **`public.mapalab_card` deprecado** en el backend mapalab:
    - `MapalabRepository` borrado (`app/repositories/mapalab_repository.py`)
    - `Mapalab_Card` model borrado (`app/models/mapalab.py`)
    - `routers/metadata.py` eliminó fallback legacy: lee solo de `mapalab.layer_metadata`/`layer_stats`
    - `download_repository.resolve_db_name` ahora consulta `mapalab.layer_metadata.layer_name_db`
- **ETL Google Sheet eliminado en dataengine-jobs**:
    - Borrados: `jobs/run_bootstrap.py`, `jobs/core/mapalab_card/*`, `jobs/core/schemas/mapalab_card.py`, `jobs/alembic/mapalab_card/*`
    - Borradas deps de runtime: `pandas`, `gspread`, `google-auth`, `alembic` en `requirements.txt`
    - Credenciales Google (`iieg2025-cloud-*.json`) purgadas del container
    - **Preservado:** `jobs/bootstrap/run_migrate_mapalab_card.py` (migración 1-shot self-contained) + target `make migrate-mapalab-card`
- Env vars `MAPALAB_CARD_DB_*` renombradas a `DATAENGINE_DB_*` en los jobs y Makefile de dataengine

### Notas de despliegue
- En producción la tabla `public.mapalab_card` todavía existe. Secuencia obligatoria antes del pull del backend mapalab:
    1. `cd /IIEG/mapalab-dataengine && git pull && make up`
    2. `make bootstrap-v14 LAYERS_JSON=...` (idempotente: crea schema + seed + migra `mapalab_card` → `layer_metadata`/`layer_stats`)
    3. Verificar counts en `mapalab.layer_metadata` (esperado ~107) y `mapalab.layer_stats` (~102)
    4. `cd /IIEG/mapalab && git pull && make up`
- Documentada en `mapalab-dataengine/docs/bootstrap-v14.md` sección "Despliegue en produccion (primera vez)"

## [1.6.0] - 2026-04-22

### Agregado
- **Selector GeoServer en `LayerEditDrawer`**: los campos `workspaceAlias`, `geoserverLayer` y `styles` se poblan desde `/geoserver/workspaces` y `/geoserver/workspaces/{alias}/layers/{layer}/styles`, reemplazando inputs libres por `Select` + `AutoComplete`. Evita errores de captura manual y deriva `layers` por workspace
- **Edición masiva de tags** (`BulkTagsDrawer` + `PATCH /layers/bulk-tags`): drawer con textarea que acepta paste-from-Excel (TSV). Parsea filas `layer_id [TAB] tag1, tag2`, muestra preview en tabla y aplica hasta 500 capas por request. Reporta `not_found` por capa inexistente
- **Rate limiter en memoria** (`app/api/rate_limit.py`) con sliding window per user_id: `60 req/min` en writes de `layers.py` + `layer_metadata.py`, `120 req/min` en reads de `geoserver.py` (protege llamadas a GeoServer REST). Responde `429` con `Retry-After`
- `useLayerTreeAdmin` expone `listGeoserverWorkspaces`, `listGeoserverFields`, `listGeoserverStyles`, `bulkUpdateTags`

### Cambiado
- Endpoints write de `layers.py` (`POST`, `PUT`, `DELETE`, `PATCH /reorder`, `PATCH /initial-order`, `PATCH /bulk-tags`, `POST /duplicate`) añaden dependencia `_write_rate_limit`
- Endpoints write de `layer_metadata.py` (`PUT /{layer_key}`, `PUT /{layer_key}/stats`) añaden dependencia `_write_rate_limit`

## [1.5.1] - 2026-04-22

### Agregado
- **Workflow editora → borrador → admin aprueba**: UI del editor diferencia role. Editora ve "Guardar borrador" y "Enviar a revisión"; admin ve "Guardar" directo. Usa `PUT /borradores/layer/{id}` + `POST /borradores/layer/{id}/solicitar-revision` (endpoints genéricos existentes). Admin aprueba con `/borradores/por-id/{id}/aprobar` que materializa en DataEngine
- `useLayerTreeAdmin.js` expone `saveLayerDraft`, `requestReview`, `getLayerDraft`
- `LayerEditDrawer.jsx` recibe prop `isAdmin` y ajusta botones
- **Tests smoke mapalab backend** (8 tests): `/health`, `/layers/tree` con ETag + 304, `/layers/initial-order`, `/layers/workspaces`, validación `/search`. Primer test backend del repo (antes: 0)
- **Tests unit mariachi** (18 nuevos): `test_stats_templates.py` cubre validación de SQL injection, identificadores, positions duplicadas, todas las operaciones + `build_query` con placeholders
- **`docs/runbook-layers.md`** con 8 escenarios de recuperación: cache corrupta, layers vacío, stats desactualizadas, permisos mariachi, cron parado, ETag stale, rollback, Alembic roto

### Cambiado
- mapalab backend: primer `test/` directory con `conftest.py` que mockea DB + SchedulerService

## [1.5.0] - 2026-04-22

### Seguridad
- **Template catalog reemplaza SQL libre en `stats_config`**: eliminada la capacidad de escribir SQL arbitrario. Ahora 8 operaciones validadas: `count`, `count_distinct`, `count_where`, `sum`, `avg`, `min`, `max`, `latest`. `schema`, `table`, `field`, `where_field`, `order_field` validados como identificadores (`[A-Za-z0-9_]{1,100}`). Valores interpolados por `:param` (no concatenados)
- **Debounce de `notify_tree_changed()` en mariachi** (5s): múltiples writes disparan solo 1 refresh del tree cache
- `WORKSPACE_SCHEMA_MAP` hardcoded eliminado en mapalab backend: `resolve_schema()` ahora hace lookup cacheado a `mapalab.workspaces`

### Agregado
- `app/services/stats_templates.py` en mariachi con `validate_stats_config`
- Diagrama de secuencia Mermaid en `docs/layers.md` (flujo editora → admin → visor)

### Cambiado
- `run_refresh_layer_stats.py` en dataengine-jobs usa el mismo template catalog

### Breaking (MINOR bump)
- `stats_config` en `mapalab.layer_stats` cambió de shape: antes `{query, format}`, ahora `{operation, schema, table, field, ...}`. Rows con el viejo shape se marcan como inválidas en el refresh job (skipped). Admin debe reconfigurar desde el editor.

## [1.4.8] - 2026-04-22

### Corregido
- **Búsqueda no encontraba leaves** tras migración: `processLayerTree` en `searchConfig.js` usaba `if (child.children)` pero el backend devuelve `children: []` consistentemente, marcando los leaves como "no-leaf" y saltando su indexación
- Cambio: usar `Array.isArray(children) && children.length > 0` como chequeo

### Agregado
- `docs/search.md` (reescrito) describe el flujo completo: scoring, edición de tags, ejemplos prácticos

## [1.4.7] - 2026-04-22

### Corregido
- **Búsqueda de capas no encontraba resultados** tras el refactor de v1.4.3: `searchConfig.js` construía `SEARCH_CONFIG` al importarse desde el barrel `layers` (ya eliminado), quedándose vacío
- Ahora `SEARCH_CONFIG` es mutable y se construye via `rebuildSearchConfig(tree)` invocado en `LayersProvider` tras el fetch
- Mantiene el scoring sofisticado del cliente (Levenshtein, normalización de plurales, pesos por label/tag) — cero round-trips por keystroke

### Notas de arquitectura
- La búsqueda de **nombres de capas** sigue siendo 100% client-side (latencia cero)
- El endpoint `GET /mapalab/api/layers/search` se mantiene para otros consumidores (links compartidos, API pública futura)
- Para que una capa sea encontrada por palabras clave sinónimas (ej. "IMSS" cuando se busca "hospital"), usar el campo `search_tags` en el editor mariachi (`mapalab.layers.search_tags TEXT[]`). El scoring ya asigna hasta +25 puntos por tag match

## [1.4.6] - 2026-04-22

### Corregido
- **InfoBox no mostraba información de features** y **descargas WFS fallaban**: los servicios `featureInfoService.js` y `downloadService.js` importaban `layers` del barrel obsoleto (v1.4.3 eliminó esa exportación)
- `featureInfoService.js`: `getFeatureInfoForActiveLayers` y `getFeaturesInPolygonForActiveLayers` reciben `allLayers` como parámetro; los callers en `useFeatureInfo.js` lo pasan desde `MapsContext.allLayers`
- `downloadService.js`: setter module-level `setLayersForDownloadService(layers)` (mismo patrón que `layerMetadataService`), invocado en `LayersProvider` tras el fetch

### Cambiado
- Tests de `downloadService.test.js` actualizados al nuevo shape de mocks

## [1.4.5] - 2026-04-22

### Corregido
- **Capas WMS no se renderizaban**: el backend devuelve `wmsConfig` con campos estructurales (`geoserverWorkspace`, `geoserverLayer`, etc.) pero el frontend esperaba `baseUrl` + `layerName` completos para OpenLayers
- `hydrateLayerTree(tree)` en `helpers/wmsConfig.js` construye `baseUrl` y `layerName` en cliente usando `VITE_GEOSERVER_URL`, aplicado en `LayersProvider` justo después del fetch
- Consumidores (`useWMSLayerFactory`, `useWMSLayerManager`, `useWMSLegend`) no cambian — siguen leyendo `wmsConfig.baseUrl` y `wmsConfig.layerName` transparentemente

### Cambiado
- Backend permanece agnóstico de la URL pública del GeoServer; si cambia el dominio no hay que redeployar backend
- Tests: 9 nuevos en `wmsConfig.test.js` (477 → 478); `createWMSConfig` (eliminado en v1.4.3) reemplazado por `hydrateWmsConfig` + `hydrateLayerTree`

## [1.4.4] - 2026-04-22

### Agregado
- `docs/layers.md` con arquitectura completa del sistema de capas v1.4.x
- Script idempotente de bootstrap para DataEngine (`mapalab-dataengine/scripts/bootstrap-v14.sh`) que orquesta rol, schema, migraciones y seed en un solo comando
- `make bootstrap-v14 LAYERS_JSON=...` en `mapalab-dataengine`

### Eliminado
- `docs/planes/PLAN_MIGRACION_CAPAS.md` y `docs/planes/ADR_001_capas_architecture.md` (ya implementados)
- Flag `VITE_LAYERS_FROM_BACKEND` (siempre on)

## [1.4.3] - 2026-04-22

### Cambiado
- **Refactor total del sistema de capas**: eliminados los 9 archivos `frontend/src/pages/maps/helpers/layers/definitions/*.js` (~1590 líneas), `rasterHelpers.js` y `layerFactory.js`
- Nuevo `LayersContext` + `LayersProvider` + hook `useLayers()` como fuente única del árbol
- Los 20 consumidores migrados a consumir vía `useLayers()` o `MapsContext.allLayers`
- `layerMetadataService` usa setter module-level (`setLayersForMetadataService`) inyectado por `LayersProvider`
- `layers/index.js` reducido a 1 línea (re-export de `findLayerById`)

### Eliminado
- `frontend/src/hooks/useLayerTree.js` (reemplazado por `useLayers`)
- `frontend/scripts/export_layers_to_json.mjs` (ya no hay JS que bundlear)

## [1.4.2] - 2026-04-22

### Agregado
- **Metadata de capas en DataEngine**: tablas nuevas `mapalab.layer_metadata` (descriptiva) y `mapalab.layer_stats` (numeralia + `stats_config` con queries SQL)
- Endpoints CRUD en mariachi: `/api/administrador/layer-metadata/{layer_key}` + `/stats`
- Script 1-shot `mariachi/api/scripts/migrate_mapalab_card.py` que copia `public.mapalab_card` → `mapalab.layer_metadata` + `mapalab.layer_stats` (idempotente)
- Job diario `run_refresh_layer_stats.py` en `dataengine-jobs` que ejecuta `stats_config` (whitelist SELECT-only) y popula `values`
- `make refresh-layer-stats` y `make refresh-all` (incluye stats)

### Cambiado
- `mapalab/backend/app/routers/metadata.py` lee de `mapalab.layer_metadata` primero, fallback a `public.mapalab_card` legacy
- `jobs/run_bootstrap.py` (ETL Google Sheet) emite deprecation warning; requiere `FORCE_LEGACY_ETL=1` para correr

## [1.4.1] - 2026-04-22

### Agregado
- **Tree materializado** en tabla `mapalab.layer_tree_cache` (singleton JSONB). `GET /mapalab/api/layers/tree` sirve desde DB + caché en memoria del proceso
- Container `dataengine-jobs` (renombrado de `dataengine-mapalab-card`) ahora corre cron con tres tareas diarias: `refresh_periodicity` (03:00), `refresh_layer_tree` (04:00), `refresh_layer_stats` (04:30)
- `make refresh-layer-tree`, `make refresh-periodicity`, `make refresh-all` en `mapalab-dataengine`
- Endpoint `POST /mapalab/api/layers/refresh-cache` para trigger HTTP desde mariachi
- `mariachi/api/app/services/mapalab_notifier.py` invoca el refresh tras cada write

### Cambiado
- `mapalab/backend/app/services/scheduler_service.py` vaciado — los jobs periódicos viven ahora en DataEngine
- Carpeta `mapalab-dataengine/mapalab_card/` → `jobs/` (git mv)

## [1.4.0] - 2026-04-22

### Agregado
- **Arquitectura de capas dinámica**: definiciones ya no se leen de archivos JS hardcodeados. Tablas en DataEngine schema `mapalab`: `layers` (250 nodos seed), `workspaces` (11), `initial_layer_order` (6)
- **Editor de capas** en mariachi `/administrador/mapalab/layers` con Ant Design Tree + drawer de edición (Collapse: Identidad, Visibilidad, WMS, Descarga, InfoBox template)
- **Borradores polimórficos**: `editora` crea borrador via `/borradores/layer/{id}`, admin aprueba con endpoint nuevo `/borradores/por-id/{id}/aprobar` que materializa en DataEngine
- Backend mapalab: `GET /layers/{tree, initial-order, workspaces, search}` con ETag `W/"..."` (304 si coincide)
- Backend mariachi: CRUD `/api/administrador/layers/*` + introspección GeoServer REST (`/geoserver/workspaces`, `.../fields`, `.../styles`)
- `GeoServerClient` con `httpx` para listar workspaces, capas, campos y estilos desde GeoServer REST
- Frontend: `layerTreeService.js` con fetch + ETag/If-None-Match + dedup de in-flight requests
- Templates InfoBox: `municipio`, `punto`, `punto_municipio`, `punto_ubicacion`, `punto_completo`, `custom` (expanden `infobox_params` a `infobox_config` JSON al guardar)
- Tests: 8 nuevos en `layerTreeService.test.js` (469 → 477 totales); 14 en `test_layer_service.py` mariachi

### Infraestructura
- Alembic multi-env en mariachi: `-x db=mariachi` (iieg_portal) y `-x db=dataengine` (schema `mapalab`)
- Rol `mariachi_layers` owner del schema `mapalab` en DataEngine
- `httpx` movido de dev a prod deps de mariachi

## [1.3.0] - 2026-04-21

### Agregado
- `Badge` component extendido: props `color` (`orange`/`purple`/`pink`/`violet`), `size` (`sm`/`md`), `variant` (`count`/`pill`), `text`, `onClick`. Default retrocompatible (orange, md, count)
- Sistema de "nueva característica" en `Badge` via prop `featureKey`: marca visualmente un feature nuevo, al hacer click se persiste en `localStorage` (`mapalab:feature-seen:<key>`) y no vuelve a aparecer hasta que otra key diferente active un nuevo feature
- Hook `useFeatureSeen(key)` en `@hooks/useFeatureSeen` — retorna `[seen, markSeen]`, tolera errores de localStorage (modo privado, quota)
- Auto-pausa de loops temporales al ocultar una capa: `useDateLoop` recibe `hiddenLayerIds` y detiene cualquier loop activo cuya capa pase a estado oculto (evita tile requests WMS desperdiciados)
- **Chunk splitting en Vite**: `build.rollupOptions.output.manualChunks` separa `vendor-react`, `vendor-router`, `vendor-ol`, `vendor-dnd`, `vendor-lottie` y `vendor-export`. El chunk de entrada baja de 678 kB → 105 kB (gzip 205 → 30 kB)
- `rollup-plugin-visualizer` detrás de `VITE_ANALYZE=1` para treemap y JSON de stats (`dist/stats.html`, `dist/stats.json`)
- Regla ESLint `no-restricted-imports` que bloquea todo import `.png` con mensaje explicando la alternativa (WebP/SVG). Rompe el build si se intenta meter un PNG sin `eslint-disable-next-line` justificado
- `knip` (dead-code checker) + scripts `check:dead-code` (informativo) y `check:dead-code:strict` (bloqueante). Config en `frontend/knip.json`
- `lint-staged` corriendo ESLint solo sobre archivos staged en el pre-commit hook
- `.githooks/pre-commit` agrega `npx lint-staged` tras el sync-version
- `.githooks/pre-push` agrega `npm run check:dead-code:strict` después de lint y tests
- CI (`.github/workflows/test-frontend.yml`) agrega los pasos `Dead code check` y `Build` al final del pipeline
- **Sentry** (`@sentry/react` + `@sentry/vite-plugin`) para error tracking en producción. Init en `main.jsx` gated por `VITE_SENTRY_DSN` (sin DSN, SDK no se activa — zero impacto en dev). `<Sentry.ErrorBoundary>` envuelve el `RouterProvider`. Sourcemap upload automático en CI si `SENTRY_AUTH_TOKEN` está configurado. Filtros anti-ruido: GTM, Google Analytics, YouTube embed (que genera `ERR_BLOCKED_BY_CLIENT` en navegadores con adblocker)
- Plugin **jsx-a11y** de ESLint con `flatConfigs.recommended`. Reglas noisy (`click-events-have-key-events`, `no-static-element-interactions`) en `off` por ahora — migrar `<div onClick>` → `<button>` queda como follow-up. El resto (labels, autofocus, non-interactive handlers) enforced desde ahora
- **Coverage thresholds** en `vitest.config.js`: lines 60%, functions 65%, branches 40%, statements 55%. CI corre `npm run test:coverage` en lugar de `npm test` para enforzarlos
- **Dependabot** configurado (`.github/dependabot.yml`): scan semanal de deps npm + GitHub Actions, agrupado por familias (eslint, testing, sentry, openlayers, react) para reducir ruido de PRs
- Chunk `vendor-sentry` separado en `manualChunks` (14 kB gz, se carga solo si `VITE_SENTRY_DSN` está seteado)
- Plan `docs/planes/PLAN_GLITCHTIP.md` para migrar a GlitchTip self-hosted sobre huachicol cuando haya capacidad (evitar datos de errores en SaaS externo)
- **Sentry Python SDK en backend**: `sentry-sdk[fastapi]` en requirements, init gated por `SENTRY_DSN` en `server.py`. Instrumentación automática de FastAPI. Variables `SENTRY_DSN` y `SENTRY_TRACES_SAMPLE_RATE` en `.env.example`
- **Dependabot para pip** (backend): scan semanal, grupos `fastapi-stack` y `sqlalchemy`
- **Security headers conservadores** en `nginx/nginx.conf`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (geolocation=self, microphone/camera=none). CSP queda como follow-up (requiere inventario completo de orígenes)
- Util `@utils/a11y.js` con `handleKeyActivate(callback)` para agregar soporte de teclado (Enter/Space) a elementos interactivos
- Alias `@utils` en `vite.config.js` (ya estaba en vitest)
- Tests: `LottieSpinner.test.jsx` (2 tests), `useFeatureSeen.test.js` (7 tests), `layerExtentService.test.js` (8 tests) — 452 → 469 tests
- **Servicio `layerExtentService.js`** con `fetchLayerExtent(layer)`: hace WFS `GetFeature` en `EPSG:3857`, parsea GeoJSON con `ol/format/GeoJSON` + `ol/source/Vector`, retorna `source.getExtent()`. Cachea por `baseUrl|layerName|cqlFilter` (LRU max 50), timeout 10s, tolera errores retornando `null`. Exporta `clearExtentCache()` para tests/reset
- **Modo dinámico `defaultZoom: 'fit'`** (también `{ fit: true }`) en `applyDefaultZoom` (`useLayerToggle.js`): hace fetch del extent real de las features y llama `view.fit(extent, { padding: [40,40,40,40], maxZoom: 18, duration: 500 })`. Alternativa al extent hardcoded para capas donde el bbox es incierto o cambia en GeoServer. Documentado en `docs/zoom.md`
- **3 capas Primavera** (`bosque_de_la_primavera`, `agave_primavera`, `parcelas_primavera`) usan `defaultZoom: 'fit'` — encuadran al extent real del ANP dinámicamente
- Constantes `FIT_PADDING`, `FIT_MAX_ZOOM`, `FIT_DURATION` en `useLayerToggle.js` para unificar los parámetros de `view.fit` / `view.animate`
- `role="region"` en carrusel de opciones en Home para etiquetado semántico
- `aria-pressed` en `ActiveLayerItem` para indicar estado seleccionado
- `aria-expanded` en cards de FAQ en Home para indicar estado colapsado/expandido

### Cambiado
- Labels de los botones del header de `ActiveLayersList` (Mostrar/Ocultar, Eliminar, Pausar animaciones) ahora son visibles siempre cuando hay ≤ 2 botones; se ocultan automáticamente cuando hay > 2 (ej. cuando aparece el de pausa global). Lógica a prueba de futuros botones via `visibleHeaderButtons`
- 3 badges hardcodeados en `ActiveLayersList` (conteo de visibles, eliminar, loops activos) y el pill `index/total` de `MobileFeatureHeader` migrados al componente `Badge` con sus props semánticos
- Controles de periodicidad en `ActiveLayerItem` (label de fecha, play/pause, velocidad, dirección) se ocultan cuando `layer.visible === false` — un solo guard en el contenedor padre
- Botón play/pause en `ActiveLayerItem` siempre se renderiza junto a velocidad/dirección (antes desaparecía cuando `canPlayLoop === false`). Si no hay config inferible de loop, se renderiza `disabled` con `opacity-50 cursor-not-allowed`
- `gap-3` → `gap-2 md:gap-3` en el row de botones del header de `ActiveLayersList` para mejor ajuste en viewports angostos
- `SwipeToRemove`: al confirmar el swipe, la card eliminada ahora colapsa su `max-height` y `margin-top` a `0` en paralelo con el `translateX` (transición 220ms ease-out). Las cards restantes se deslizan hacia arriba suavemente en vez de saltar al desaparecer la eliminada
- **Mobile — paneles de capas ya no bloquean clicks del mapa**: `MapLayersPanels` añade `max-md:pointer-events-none` al contenedor `Panel` (transparente), y los paneles internos (`ActiveLayersList`, `SymbologyPanel`, wrapper del `Message`) añaden `max-md:pointer-events-auto`. En mobile los clicks pasan por las zonas vacías/gap del panel al mapa, permitiendo mediciones a la altura de Simbología/Capas Activas
- **Home — scroll**: `min-h-screen` root con `overflow-x-hidden` (previene overflow horizontal residual de `mx-[3%]` / `ml-[3%]` + cards del carrusel). Carrusel de opciones con `[&::-webkit-scrollbar]:hidden [scrollbar-width:none]` (antes usaba `scrollbar-thin scrollbar-hidden`, clases inexistentes)
- **Scrollbar vertical global personalizado** en `index.css`: `html { scrollbar-width: thin; scrollbar-color: rgb(156 163 175 / 0.5) transparent }` + `html::-webkit-scrollbar { width: 6px }` con thumb gris translúcido y hover más oscuro. Aplica a toda la app
- **11 assets PNG → WebP** (lossless `cwebp -lossless`): `ico_preguntas`, `bannerHeader`, `img_info_banner`, `img_descargada_banner`, `img_herramientas_banner`, y los 6 `minimap_{estatal,federal}_{voyager,positron,sin_mapa}`. Ahorro ~170 kB sobre la optimización previa con `oxipng`. Imports actualizados en `selectConfig.js`, `bannerConfig.js`, `suportConfig.js`, `minimapImages.js`
- Imports dinámicos de OpenLayers (`ol/style`, `ol/layer/Vector`, etc.) en `useMapMarker.js` y `MapControls.jsx` convertidos a estáticos (ya estaban en el bundle; el `import()` no lograba code-split)
- Barrel `pages/maps/helpers/layers/index.js` reducido a solo re-exportar `findLayerById` y `layers`. Los consumidores (`useLayerManagement`, `useActiveLayersLogic`, `useFeatureInfo`) importan directo desde `utils/layerHelpers`
- Barrel `pages/maps/components/ActiveLayers/index.js` reducido a solo `ActiveLayersList`
- **Lottie lazy-loaded**: extraído `LottieSpinner.jsx` como componente dedicado, cargado via `React.lazy` + `Suspense` en `Logo.jsx`. El chunk `vendor-lottie` (82 kB gz) ya no está en el path inicial — se carga solo cuando Logo monta, en paralelo al resto
- **`vendor-export` dividido** en dos chunks: `vendor-download` (jszip + pako + fast-png + fflate + iobuffer, 46 kB gz — solo para descargas) y `vendor-export` (jspdf + html2canvas + deps, 220 kB gz — solo para MapExport). Usuarios que solo descargan ya no cargan las libs de PDF
- CI usa `npm run test:coverage -- --run` en lugar de `npm run test -- --run` para que los thresholds rompan el build si la cobertura baja
- **Lottie condicionado a `isLoading`**: `LottieSpinner` ya no se renderiza si el usuario nunca ha disparado un estado de carga — el chunk `vendor-lottie` (82 kB gz) se descarga solo bajo demanda real. Estado `lottieNeeded` se activa en el primer `isLoading=true` y se mantiene para permitir fade-outs subsecuentes
- **A11y: `<div onClick>` refactorizados a `<button type="button">` o con `role="button" tabIndex={0} onKeyDown`** en:
  - `Badge`, `Icon`: span clickeable ahora condicionalmente `<button>` cuando hay onClick
  - `MobileSheet`: backdrop como `<button aria-label="Cerrar">` con fondo full-bleed
  - `Body.jsx`: FAQ cards con `role=button`, `aria-expanded`, `onKeyDown` para teclado
  - `ActiveLayerItem`: capa clickeable con `role=button`, `tabIndex=0`, `aria-pressed`
  - `ActiveLayersList`: 3 toggles del header (visibilidad, eliminar, pausar) convertidos a `<button>` con `disabled` apropiado
  - `LayerItem`, `LayerDetailModal`, `QualitySelector`, `MenuItem`: span/div con click → `<button>`
  - Reglas ESLint `click-events-have-key-events` y `no-static-element-interactions` reactivadas

### Corregido
- Import no usado `openDataImg` en `MapAttribution.jsx` — limpia el error de lint preexistente
- **Swipe-to-remove en InfoBox mobile**: bug de "index as key" que causaba que los estilos inline del card eliminado (translateX, maxHeight: 0) se aplicaran al siguiente card que tomaba su slot en el array. Fix: `key={feature.id ?? \`${result.layerId}-${featureIdx}\`}` para que React desmonte el card correcto y las animaciones queden aisladas

### Eliminado
- 4 PNGs huérfanos en `src/assets/images/`: `img_link_share.png` (el OG image vive en `public/`), `testBG.png`, `search.png`, `80x15_open_data.png`
- 9 componentes `.jsx` detectados por knip como muertos: `components/ConfirmModal.jsx`, `components/HamburgerMenu.jsx`, `components/Navigation.jsx`, `components/MenuItem.jsx`, `pages/home/components/PrimaryButton.jsx`, `pages/maps/components/NavigationButton.jsx`, `pages/maps/components/InfoBox/components/LabelGroup.jsx`, `pages/maps/components/MapExport/ExportMapFooter.jsx`, `pages/maps/components/MapExport/utils/layoutHeader.jsx`
- Funciones sin usar: `getLayersWithWMS`, `loadLayerSymbology`, `loadMultipleLayersSymbology` (`layerHelpers.js`); `isCategoryLayer` (`symbologyHelpers.js`); `getSearchConfigByTheme` (`searchConfig.js`); hook `useSiderAnchoredPosition` (`SiderContext.jsx`)
- Constantes sin usar: `SIDER_TRANSITION_LEFT`, `SIDER_TRANSITION_BOTH` (`constants/sider.js`)
- `export default` sin consumir en `SiderContext.jsx`, `SearchContext.jsx`, `useFeatureSeen.js`
- Exports degradados a locales (usados solo internamente): `createBaseItems`/`createCategoryItems` (`menuItems.jsx`), `getWMSLayerName` (`symbologyHelpers.js`), `fetchWithProgress` (`downloadService.js`), `SEARCH_CONFIG` (`searchConfig.js`), `isMobileViewport` (`defaultView.js`), `FEATURE_SEEN_PREFIX` (`useFeatureSeen.js`)

### Rendimiento
- Bundle inicial menor y chunks con hash estable: los `vendor-*` cambian solo cuando se actualiza la librería, mientras el código de app cambia seguido. Mejor cacheo en navegadores y gateway-hub
- Assets estáticos (imágenes de branding y minimaps) ~170 kB totales menos tras migración a WebP

## [1.2.0] - 2026-04-17

### Agregado
- **Sistema de loop de fechas generalizado** (`useDateLoop`, renombrado desde `useRasterLoop`): soporta modo `year` y `month` tanto para capas raster como vectoriales (CQL_FILTER). Helpers nuevos en `dateLoopHelpers.js` (`describeDateFilter`, `formatLoopLabel`, `buildLoopValues`, `computeSelectorInitialState`). El loop infiere modo segun vista del selector (`expandedYear`) o filtro activo
- Controles de loop en header "Periodicidad:" del LayerDetailModal: `PlayPauseButton`, `LoopIntervalButton` (morado, cicla 250/500/1000/2000/3000 ms), `LoopDirectionButton` (morado, toggle LTR/RTL), boton eliminar filtro
- Componentes extraidos a `SimpleDateSelectorParts.jsx`: `BackButton`, `YearBadge`, `PlayPauseButton`, `CarouselArrow`, `LoopIntervalButton`, `LoopDirectionButton`
- Etiqueta de fecha activa en `ActiveLayerItem` con formatos `"2024"` / `"JUN 2024"` / `"3 MESES 2024"` / `"N AÑOS"`. Anchos fijos por tipo (static vs loop) para evitar rebote. Click: toggle loop si es posible, si no abre modal
- Badge morado de intervalo (`"1s"`, `"2s"`) junto al label en `ActiveLayerItem` cuando `loopIntervalMs !== DEFAULT_LOOP_INTERVAL_MS` y el loop corre
- Auto-scroll del carrusel de años al valor current del loop durante mode `year` (si queda fuera del viewport, scroll suave para centrarlo)
- Prop `onExpandedYearChange` en `SimpleDateSelector` para que el modal conozca la vista (año vs mes) y decida el modo del loop
- Edicion en-mapa de Emoji/Texto colocados: click para seleccionar (halo morado), drag para mover, sliders de rotacion y escala 50-300%, boton eliminar. Toolbar flotante posicionado via `ol.Overlay` que sigue pan/zoom. Escape o cambio de herramienta deseleccionan. Ver `docs/draw.md`
- `useMapEditing` hook con `ol.interaction.Translate` + `editingClickedRef` (evita conflicto con el query de InfoBox)
- `FeatureEditToolbar` componente reutilizable para controles de transformacion
- `createEmojiStyle` / `createTextStyle` extendidos con `scale` y `selected`
- Flag `openOnShow` en definiciones de marker para abrir automaticamente la InfoBox al aparecer (opt-in, activo en marker del IIEG)
- Helper `openMarkerCard(feature)` exportado de `useMapMarker` y reutilizado en el click handler
- Componente primitivo `MobileSheet` (`components/MobileSheet.jsx`) con portal, backdrop, translateY, Escape, click-fuera y body lock configurables
- Rama mobile en InfoBox: bottom-sheet con indicadores "hay mas arriba/abajo" (via `useScrollOverflow`) y seccion de herramientas (`InfoBoxTools`) extensible en el header
- Componente `InfoBoxTools` con API `tools=[{ id, icon, label, tooltip, onClick, disabled }]` para crecer con mas acciones a futuro
- `MobileFeatureHeader` — header alternativo para cards en mobile: barra lateral morada + titulo tipografico, sin bloque `#EFF3FC` fijo
- `renderCard(variant)` acepta `'desktop'` (default) o `'mobile'` y elige el header correspondiente
- `SwipeToRemove` — wrapper que permite eliminar cards deslizando horizontalmente (solo mobile) con etiqueta guia "Desliza para eliminar"/"Eliminando…"
- `LicenseTooltipContent` — extraido de `DownloadButton` a `@components/` para reuso (tooltip legal de descarga)
- Tipografias aumentadas en `Text`, `List`, `Cards`, `IconText`, `Label` cuando `variant='mobile'` (de 10px a 12px, y de `text-sm` a `text-[15px]` en valores de cards)
- Grid de `Cards` fuerza `grid-cols-2` en mobile aunque el template indique 1 columna
- `ScrollContainer` reemplaza el scroll manual de InfoBox mobile — incluye flechas bounce arriba/abajo y fade gradient nativos
- `InfoCard` — wrapper compartido con shell `bg-white rounded-[10px] shadow-[...]` y header adaptativo (`desktop`/`mobile`). Unifica renderCard, `EmptySuggestions`, `SummaryCard` y el estado "sin capa seleccionada", elimina duplicacion de la cascara y los 3 estilos de header
- Cache de `alternativeResults` en `selectedFeatureInfo` — al tapar una capa sugerida se filtra en memoria sin re-consultar GeoServer. Limpieza proactiva por cambio de `activeLayerIds` o `filters`. Ver `docs/cache.md`
- `docs/cache.md` — inventario centralizado de todos los caches del proyecto (frontend memoria/storage, backend, nginx, assets)
- `getDefaultMapView()` y `getMinZoom()` en `helpers/defaultView.js` — centralizan la vista inicial y minZoom del mapa
- Capa de salud con `defaultDate: 'latest'`
- Icon `done` en `Icon.jsx`

### Corregido
- Vectoriales tambien pueden animar periodo (antes solo raster). Al iterar, el `ActiveLayerItem` mantiene visible el boton de detalle durante el loop (antes desaparecia por `isLoading`)
- En polígonos, regresar a "todos los años" mantiene el año seleccionado en naranja (antes se perdía la selección visual al volver). Re-click del mismo año preserva la selección del mes
- Sincronización con filter externo: al limpiar el filtro desde el header, el selector vuelve a la vista de años limpia (antes quedaba el state local desincronizado)
- Al tapar una capa alternativa en EmptySuggestions ahora se muestran sus features en el punto clickeado (antes solo cerraba el panel sin mostrar nada)
- Documentacion `docs/mobile-sheet.md` y `docs/infobox.md`

### Cambiado
- Etiqueta de fecha en `ActiveLayerItem` no muestra el ícono play estático (solo pause cuando corre el loop)
- Padding reducido en etiqueta (`p-1.5` → `p-1`, `rounded-[12px]` → `rounded-[10px]`), fuente 9px → 10px
- Años ordenados descendente en `buildLoopValues` para matchear el orden visual del carrusel
- Cuando el loop corre, el año/mes actual se pinta en naranja institucional (no morado) para indicar el tick
- En vista de meses el tick del loop no muestra borde naranja (más sutil), manteniendo `border-transparent` para no rebotar
- Click en el logo IIEG del sider colapsa el sider en mobile (`closeSider`) ademas de mostrar el marker
- `showMarker` llama a `openMarkerCard` como callback de `view.animate`, garantizando que la InfoBox quede centrada sobre el icono al terminar la animacion
- `MobileMenu` refactorizado como wrapper delgado de `MobileSheet` conservando `registerInSider`
- `Header` y `EmptySuggestions` del InfoBox usan `w-full` en lugar de `w-[239px]` fijo, el ancho lo determina el contenedor padre
- `useMapInitialization` respeta `layers` en URL para decidir si aplicar `lat/lon/zoom` (evita centrar en coordenadas sin capas)
- `SymbologyPanel` boton siempre clickeable (abre panel aunque no haya capa)
- `iturConfig` cards con `decimals: 2` para métricas proporcionales
- ActiveLayersList: boton de modo base también activa capas si no hay ninguna activa

## [1.1.4] - 2026-04-15

### Agregado
- Tooltip de licencia IIEG en botones de descarga de capas y visualizacion con link clickeable al PDF
- Prop `interactive` en componente Tooltip para permitir clicks en contenido (links, botones)
- Constantes `LICENCIA_URL` y `LICENCIA_TEXTO` en `@constants/app`
- LittleCard especifica para capa ANP Jalisco con campos nombre, jurisdiccion, tipo, area_ha

### Cambiado
- CI/CD optimizado: tests corren 1 vez (en auto-merge) en lugar de 3, cache de npm en CI, deploy con `git reset --hard` para evitar conflictos
- Emojis: eliminada categoria Banderas y emoji 💩

### Corregido
- ID de capa ANP colisionaba con ID de categoria (fix en v1.1.3 incompleto)
- Panel de emojis aparecia detras del boton cerrar herramientas en mobile (z-index)

## [1.1.3] - 2026-04-15

### Agregado
- Capa "Areas Naturales Protegidas" en Recursos > Areas Protegidas
- Catalogo completo de emojis con 9 categorias y tabs en herramienta de mediciones
- Video de YouTube en pagina de inicio despues de la guia
- Meta tags Open Graph y Twitter Card para compartir enlaces con imagen y descripcion
- Plugin Vite `htmlMetaPlugin` para inyectar URL del sitio en meta tags en build time

### Cambiado
- Licencia Creative Commons BY 4.0 reemplazada por Licencia IIEG 2026 en atribucion del mapa
- Titulo de guia en home: "¿Que puedes hacer en MapaLab?" en lugar de "¿Como navegar en MapaLab?"
- Titulo de la pagina: "MapaLab — IIEG"
- Meses en fechas de ultima actualizacion en minusculas
- Boton centrar Jalisco usa `view.fit()` con padding proporcional al viewport (responsive)
- Panel de emojis homologado al ancho de Mis Mediciones (334px)

### Corregido
- ID de capa `areas_naturales_protegidas` colisionaba con ID de categoria, renombrado a `anp_jalisco`
- InfoBox: links no se activan accidentalmente al aparecer (200ms delay de pointer-events)
- Modal: scroll en mobile no cierra el modal (stopPropagation en touchstart/mousedown)
- Modal: backdrop solo cierra con tap, no con swipe (deteccion de movimiento < 5px)
- Boton centrar Jalisco ahora aparece correctamente en mobile (fix mouseLeave en touch devices)
- useOutsideClick ignora eventos dentro de elementos con role="dialog"

## [1.1.2] - 2026-04-15

### Agregado
- Control de SEO por entorno: `SEO_ENABLED` en Nginx bloquea robots.txt, sitemap.xml y agrega `X-Robots-Tag: noindex` en staging. Produccion lo habilita con `SEO_ENABLED=true`
- Retry con 3 intentos en workflow de auto-merge para PR inestables

### Cambiado
- Descripcion del proyecto actualizada en package.json y marker IIEG

## [1.1.1] - 2026-04-14

### Cambiado
- InfoBox del marker IIEG: tecnologias como etiquetas individuales, nombre del instituto como campo "Organismo"
- Retry con 3 intentos en workflow de auto-merge para PR inestables
- Instrucciones de versionado en context.md incluyen actualizacion de release notes

### Corregido
- Orden de renderizado en renderCard restaurado al original (list → iconText → text → cards) para no afectar otros InfoBox
- Label opcional en componente List del InfoBox

## [1.1.0] - 2026-04-14

### Agregado
- Propiedad `defaultZoom` en definiciones de capas: zoom automatico al activar (3 formatos: numero, zoom+center, extent)
- Propiedad `zoomRange` en definiciones de capas: rango de zoom para visibilidad via `minZoom`/`maxZoom` de OpenLayers
- Boton "Centrar en Jalisco" en controles del mapa: aparece al hacer hover sobre zoom-in, resetea vista a bounds de Jalisco
- Hook `useMapMarker`: marcadores temporales reutilizables con icono, zoom, fondo circular, `minZoom`/`maxZoom` y auto-hide
- InfoBox para markers: click en marcadores muestra InfoBox con datos estaticos via propiedad `infoBox` en definiciones
- Prioridad de click en markers: si el click cae sobre un marker visible, bloquea el query WFS de capas
- Click en logo IIEG del sider muestra marcador de MapaLab sobre el instituto con InfoBox (version, contacto, tecnologias)
- Constante global `APP_VERSION` inyectada desde `package.json` via `define` en Vite
- Archivo centralizado `markerDefinitions.js` para definiciones de markers reutilizables
- Script `scripts/sync-version.sh` y pre-commit hook para sincronizar version en README y package-lock
- Documentacion: `docs/zoom.md`, `docs/markers.md`
- Iconos `fit_extent` (normal/hover) para boton de centrar vista

### Cambiado
- Color del punto de geolocalizacion de azul (`#3b82f6`) a naranja (`#f97316`)

## [1.0.10] - 2026-04-13

### Agregado
- Capa "Carencia por calidad y espacios de la vivienda (%)" en Desarrollo Social > Pobreza y vulnerabilidades

## [1.0.9] - 2026-04-13

### Corregido
- `formatNumber` se aplicaba a campos de fecha y folio en InfoBox. Se agrega propiedad `raw` en definiciones de `list` y `cards` para omitir el formateo numerico (aplicado en salud, educacion y recursos)

### Cambiado
- Componente `IconText` del InfoBox: ubicacion abre Google Maps, telefono abre marcador (`tel:`), mejor alineacion de icono y texto, espaciado entre items

## [1.0.8] - 2026-04-13

### Corregido
- Descargas de capas grandes (>1GB) fallaban por timeout de 120s en la cadena de proxies (nginx mapalab y gateway-hub). Timeout aumentado a 600s con `proxy_buffering off` para rutas de descarga
- Primera descarga lenta por cold start del pool de conexiones a PostgreSQL. Se agrega warm-up del pool al iniciar cada worker de Gunicorn

### Cambiado
- Configuracion del pool de conexiones SQLAlchemy con `pool_size=4` y `max_overflow=4`

### Eliminado
- Archivos `.env` remanentes en `frontend/`, `backend/` y `nginx/` (consolidados en `.env.*` raiz desde v1.0.5)

### Agregado
- `docs/context.md` con referencia completa del proyecto para onboarding y contexto en nuevas conversaciones

## [1.0.7] - 2026-04-13

### Eliminado
- Inyeccion de GTM desde el frontend (`main.jsx`), ahora centralizada en gateway-hub via `sub_filter`
- Variables `VITE_GTM_ID` y `VITE_GOOGLE_ANALYTICS_ID` de `.env.example`, `docker-compose.yml` y `Dockerfile`

## [1.0.6] - 2026-04-13

### Cambiado
- Renombrar proyecto Docker Compose de produccion de `mapalab-staging` a `mapalab`

### Agregado
- Target `ensure-networks` en Makefile para crear redes Docker automaticamente antes de deploy/staging/prod

## [1.0.5] - 2026-04-02

### Cambiado
- Unificar Docker Compose: un solo archivo raiz con profiles (dev/staging) reemplaza 4 archivos en subdirectorios
- Centralizar variables de entorno: `.env.example` raiz con `--env-file`, elimina patron fragil de `cp .env.X .env`
- Refactorizar Makefile: comandos simplificados, elimina `cd` por directorio, agrega `make deploy` y `make staging`
- Unificar .gitignore: un solo archivo raiz reemplaza 3 archivos con patrones duplicados
- Unificar backend Dockerfile con multi-stage targets (development/production)
- Extraer workflow reutilizable de test en CI/CD, eliminar duplicacion en 3 workflows

### Agregado
- README.md raiz como punto de entrada del proyecto
- CONTRIBUTING.md con guia de contribucion y convenciones
- CHANGELOG.md con registro de cambios unificado
- CODE_OF_CONDUCT.md adaptado al contexto IIEG
- `.dockerignore` para frontend y backend (optimizar contexto de build)
- `.env.example` raiz consolidado con todas las variables del sistema
- Target `make deploy` para el pipeline de CD
- Target `make staging` para diferenciar staging de produccion
- Workflow reutilizable `.github/workflows/test-frontend.yml`

### Eliminado
- `frontend/docker-compose.dev.yml`, `backend/docker-compose.yaml`, `backend/docker-compose.prod.yaml`, `nginx/docker-compose.yml`
- `frontend/.gitignore`, `backend/.gitignore` (consolidados en raiz)
- `.env.example` de cada subdirectorio (consolidados en raiz)
- `nginx/README.md`, `frontend/README.md`, `backend/README.md` (fusionados en README raiz y docs/)
- `frontend/ARCHITECTURE.md`, `frontend/CODE_OF_CONDUCT.md`, `frontend/CHANGELOG` (fusionados en raiz)
- `backend/Dockerfile.prod` (unificado en Dockerfile con targets)
- Patron fragil de `cp .env.X .env` en Makefile
- Targets `network-create` / `network-remove` del Makefile
- Duplicacion de jobs de test en workflows CI/CD

## [1.0.4] - 2026-04-01

### Agregado
- Marcador de capa seleccionada en la URL mediante prefijo `*` dentro del parametro `layers` (ej: `?layers=limite_iieg,*economia_pib`), permitiendo preservar la seleccion al recargar y compartir enlaces con subtopico pre-seleccionado.
- Aplicacion de filtros de fecha por defecto (`defaultDate`) al inicializar capas desde URL, igualando el comportamiento de activacion desde el sider.
- Indicador de carga inmediato al crear capas WMS, garantizando que el spinner aparezca desde el inicio de la peticion.

### Corregido
- La auto-seleccion de simbologia siempre revertia a "Limites" al recargar, ignorando la capa seleccionada por el usuario. Se corrigio la logica de auto-seleccion en `useSymbology` para respetar selecciones explicitas desde URL.
- Typo en `topicsConfig.js`: el ID `establecimeintos_salud` impedia activar la capa de establecimientos de salud desde los subtopicos del inicio.

## [1.0.3] - 2026-04-01

### Corregido
- El orden de capas activas se invertia al recargar la pagina. Se reemplazo el uso de `onToggleLayer` (que anteponia cada capa al inicio del array) por asignacion directa de IDs respetando el orden de la URL.

## [1.0.2] - 2026-04-01

### Corregido
- Las flechas de navegacion del componente `ScrollContainer` aparecian sin overflow real. Se cambio a renderizado condicional para evitar que el contenido de las flechas inflara el `scrollHeight` del contenedor.

## [1.0.1] - 2026-03-30

### Cambiado
- Simplificacion de infraestructura de 4 modos de despliegue (dev, prod, ssl, ssl-local) a 2 (dev, prod), delegando SSL y proxy de GeoServer al gateway-hub externo.
- Eliminacion de configuraciones Nginx redundantes (nginx.base.conf, nginx.ssl.conf, entrypoint.sh, docker-compose.ssl.yml, conf.d/, includes/, error/, ssl/).
- Eliminacion del stack standalone del frontend (Dockerfile, docker-compose.yml, nginx.conf).
- Simplificacion del Makefile removiendo targets ssl, ssl-local, ssl-down y deploy.
- Comunicacion entre servicios via host IP:port con `extra_hosts: host.docker.internal:host-gateway` para compatibilidad Linux.

### Corregido
- URLs de descarga de metadatos retornaban 404 por prefijo `metadato_` en el nombre de archivo que no existe en el bucket de Acervo. Se remueve el prefijo al construir la URL en el backend.
- Variable `ACERVO_PUBLIC_URL` apuntaba a `host.docker.internal` que el navegador no puede resolver. Corregido a IP del host.

## [1.0.0] - 2026-03-27

### Agregado
- Descarga de capas desde el servidor con componentes frontend y API backend dedicada.
- Cancelacion de descargas de capas en lote con actualizacion de UI.
- Servicio y API dedicados de periodicidad para capas, reemplazando el mecanismo de cache anterior.
- Cache de periodicidad robusto con logica de reintentos y control de fallos consecutivos.
- Modo INEGI para consultas de informacion de features, ajustando dinamicamente columnas de geometria y parametros WMS.
- Componente `ConfirmDropdown` integrado en `ActiveLayersList` y `CloseButton` para estandarizar prompts de confirmacion.
- Boton de cierre en el panel de historial de mediciones con ancho responsive.
- Funcionalidad de finalizar dibujo en herramientas de medicion.
- Iconos SVG dedicados de play/pause para animacion de capas raster con nuevos estilos de boton y estados hover.
- Selector de calidad de exportacion de mapa con dimensiones dinamicas de captura.
- Barra de escala en exportacion de mapa, fuentes de capas, y pie de pagina con disclaimer.
- Minimapa dinamico, soporte de multiples leyendas y composicion PDF mejorada en exportacion.
- Fecha actual en nombres de archivo de mapas exportados, PDFs, imagenes y datos descargados.
- Propiedad `isCategory` para capas y logica de procesamiento asociada.
- Configuraciones detalladas de InfoBox para capas climaticas raster con formato de fecha y precision decimal.
- Etiquetas estaticas en plantillas de tarjetas InfoBox.
- Mejora del esquema de metadatos con campos de descarga, fuentes, metodologia y simbolos de StatCard.
- Capas raster habilitadas por tiempo con funcionalidad de loop y seleccion de fecha mejorada.
- Soporte de despliegue bajo ruta base configurable (`/mapalab/`).
- CORS configurables y headers de seguridad en Nginx del frontend.
- Header sticky con fondo blanco y contenedor interior purpura redondeado.
- Flag `hidePeriodicity` en definiciones de capas para controlar la periodicidad en el modal de detalles.
- Flag `hiddenInMenu` para ocultar capas del menu de temas.
- Subtemas en configuraciones de temas.
- Componente `Message` y hook `useSlowLoading` para mensajes de carga lenta.
- Iconos SVG de advertencia y tooltips responsive en items de capas activas.
- Rediseno de paginas de error y not found.
- Icono de aviso de privacidad y estado de exito de copiado en boton de compartir.
- Atribucion del mapa con funcionalidad hover-to-expand e imagen Open Data.
- Atribucion Creative Commons BY 4.0.
- Helper `formatNumber` para formato consistente con separadores de miles.
- Helper `formatDateString` para formato de fecha de ultima actualizacion.
- Soporte de multiples enlaces externos separados por coma en seccion 'Fuente'.
- Hooks de configuracion para ejecutarse con Docker en modo desarrollo.
- Propiedad `wmsGroup` en configuracion WMS para prevenir merge de requests.
- Posicionamiento sticky de capa activa seleccionada con overlays de fade.
- Panel de simbologia inicializado colapsado con auto-expansion al seleccionar capa.
- Modo zen/mobile en sider con boton de toggle y dropdown de capas base.
- Selector de fecha con auto-seleccion de mes unico y navegacion de carrusel por ano.
- Calculo dinamico de zona UTM para exportacion de mapas.

### Cambiado
- Estandarizacion de IDs de capas en configuraciones de temas y logica de activacion por URL.
- Mejora del posicionamiento sticky de `ScrollContainer` con flexbox.
- Deteccion de overflow de carrusel con `ResizeObserver` en lugar de `setTimeout`.
- Renombrado de campo 'ingresos_propios' a 'porcentaje_ingresos_propios'.
- Consolidacion de URLs de backend y GeoServer en un solo `MAPALAB_BACKEND_URL`.
- Introduccion de variables `BACKEND_HOST` y `NETWORK_NAME`.
- Estandarizacion de estilos de etiquetas con constantes `MUNICIPIO_STYLE` y `CARACTERISTICA_STYLE`.
- Renombrado del modo 'zen' a 'mobile' en sider.
- Asignacion de `wmsGroup` especificos a capas en lugar de 'default'.
- Eliminacion de debouncing en filtros WMS y actualizaciones de capas activas.
- Integracion de filtrado CQL dinamico directamente en el WMS layer manager.
- Extraccion de secciones de informacion de capa en componente `LayerInfoSections`.
- Eliminacion de `BaseLayersDropdown` y su uso en `ActiveLayersList`.
- Eliminacion de GeoJSON de formatos de descarga vectorial disponibles.
- Estandarizacion de definiciones de capas de seguridad y actualizacion de `RASTER_YEAR`.

### Corregido
- Procesamiento correcto de `metadata.metadato` como array u objeto individual al agregar archivos al zip.
- Reduccion del cooldown de `LayerDetailModal` de 60 a 5 segundos.
- Manejo de null y undefined en utilidad `toArray` y procesamiento de campos `renderCard`.
- Errores gramaticales y de acentuacion en nombres de capas de robo.
- Nombres de display de capas de limite municipal en `HIDDEN_LAYERS`.
- Resolucion de URL de endpoint de metadatos relativa al origin.
- Renderizado del variante menu de Panel usando `createPortal` a `document.body`.

### Rendimiento
- File locking para generacion atomica de cache y connection pooling de base de datos.
- Memoizacion del calculo `isInegiMode` con `useMemo`.
- Headers de seguridad, compresion gzip, timeouts de proxy aumentados e includes modulares en Nginx.
- Cache de proxy Nginx para GeoServer con bypass por request.
- Capas WMS tileadas para mejor rendimiento de carga.

## [0.9.5] - 2026-02-06

### Agregado
- Selector de fecha en detalles de capa con opcion de modo avanzado.
- Mejora en generador de filtros CQL para ignorar claves internas (prefijadas con `_`).
- Actualizacion de capa base 'Cuerpos de agua' a resolucion 50k para mejor detalle.

### Cambiado
- Refactorizacion completa del servicio de metadatos de capa para buscar por workspace y capa.
- Eliminacion del servicio de periodicidad obsoleto.
- Ajuste de offsets en `InfoBox` y mejora en deteccion de posicion de click (`originalEvent`).

## [0.9.4] - 2026-01-12

### Agregado
- Estado de carga (`isLoading`) para seguimiento de progreso en busquedas.

### Cambiado
- Implementacion de estilos visuales segun mockup para paneles de simbologia, descargas y medidas.
- Configuracion de logging para mejor compatibilidad con Docker.
- Implementacion de nuevos iconos de control de mapa (zoom, centro) con estados hover.
- Limpieza de `Makefile` para eliminar contenedores huerfanos en `docker compose down`.

## [0.9.3] - 2025-12-15

### Corregido
- Expansion y refinamiento de definiciones de subcapas en categorias de demografia, desarrollo social y economia.
- Exposicion del puerto del backend al host.

### Cambiado
- Cambio de nombre de funcion en la fabrica de base de datos.
- Estandarizacion de nombres de proyectos docker-compose en diferentes entornos.
- Limpieza de `Makefile` y `README` (eliminacion de emojis), y limpieza de archivos `.gitignore`.

## [0.9.2] - 2025-12-11

### Agregado
- Implementacion de la version inicial de la aplicacion interactiva Mapalab con componentes completos de frontend y backend.

### Cambiado
- Contenedorizacion del proceso de construccion del frontend y simplificacion de la configuracion de Nginx.

## [0.9.1] - 2025-11-12

### Agregado
- Configuracion completa de Vitest para testing del proyecto.
- Scripts npm para testing: `npm test`, `npm run test:ui`, `npm run test:coverage`.
- Soporte para cobertura de codigo con `@vitest/coverage-v8`.

## [0.9.0] - 2025-11-12

### Agregado
- Hook `useAutoCleanFilters` para limpieza automatica de filtros al eliminar capas.
- Funcion `isRenderableParentLayer` en layerHelpers para detectar capas padre renderizables.

### Rendimiento
- Reduccion del tiempo de carga de filtros desde URL de 400ms a 150ms (~62% mas rapido).
- Eliminacion de setTimeout anidados innecesarios en la inicializacion de filtros.

## [0.8.3] - 2025-11-11

### Cambiado
- Actualizacion de configuracion de capas para utilizar filtros CQL en lugar de estilos.

## [0.8.2] - 2025-11-10

### Agregado
- Sistema de sincronizacion bidireccional de filtros con la URL.
- Hook `useFilterUrlSync` para sincronizacion automatica filtros -> URL.
- Hook `useInitializeFiltersFromUrl` para carga de filtros desde URL.

## [0.8.2-beta] - 2025-11-07

### Agregado
- Componente de periodicidad en el modal de detalles de capas.
- Concatenacion de filtros CQL para parametro de periodicidad.

### Corregido
- Problema de multiple informacion al seleccionar un punto en el mapa.
- Tipo de capa para homologar con GeoServer.

## [0.8.1-patch] - 2025-11-06

### Corregido
- Problema de recarga de parametros de la URL al desmarcar capas.
- Mejora de contrastes en componentes de UI.

## [0.8.1] - 2025-10-07

### Agregado
- Implementacion del hook useLayerUrlSync.
- Helper handleShare para copiar la URL.

## [0.8.0] - 2025-10-07

### Agregado
- Frame al descargar el mapa con norte, escala grafica, leyenda, fecha y coordenadas.
- Utils: coordinateGrid, coordinateLabels, layoutFooter, layoutHeader, northArrow, symbology, symbologyData.

## [0.7.7] - 2025-09-24

### Agregado
- Implementacion del Footer en la pagina de inicio.

## [0.7.6] - 2025-09-24

### Agregado
- Implementacion de Support Section y Select Section en la pagina de inicio.

## [0.7.5] - 2025-09-30

### Agregado
- Implementacion de GuideSection en la pagina de inicio.
- Componente PrimaryButton dinamico.

## [0.7.4] - 2025-10-02

### Agregado
- Configuracion del servidor WMS para conexion con servicios de mapas externos.
- Soporte para capas WMS en el visualizador de mapas.
- Sistema de autenticacion para servicios WMS protegidos.
- Cache local para capas WMS frecuentemente utilizadas.

## [0.7.3] - 2025-09-25

### Agregado
- Topic section con tematicas y busqueda por palabra clave.
- Componentes: TopicSection, Card, CardResponsive.

## [0.7.2] - 2025-09-24

### Agregado
- Implementacion de la Hero Section en la pagina de inicio.

## [0.7.1] - 2025-09-23

### Agregado
- Header de la plataforma con opciones dinamicas.
- Hamburger menu para dispositivos moviles.

## [0.7.0] - 2025-09-04

### Agregado
- Sistema de paneles colapsables para capas activas y simbologia.
- Hooks: useActiveLayersLogic, useLayerCollapse, useLayerDragDrop.
- Funcionalidad drag & drop para reordenar capas activas (Z-index).

### Cambiado
- Refactorizacion completa de MapsProvider y ActiveLayersList.

## [0.6.8] - 2024-06-11

### Agregado
- Funcionalidad para compartir mapas mediante enlaces directos.
- Soporte para capas personalizadas de usuario.

## [0.5.5] - 2024-01-09

### Agregado
- Nuevas opciones de filtrado de datos.
- Caracteristicas interactivas de leyenda.
- Capacidades avanzadas de busqueda.

## [0.5.1] - 2025-08-22

### Cambiado
- Actualizacion de la estructura del proyecto.

## [0.1.0] - 2025-08-10

### Agregado
- Configuracion inicial del proyecto.
- Estructura basica del frontend con React.
- Componentes de integracion de mapas.
