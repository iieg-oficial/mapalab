# MCP server

Servidor [Model Context Protocol](https://modelcontextprotocol.io/) dedicado (`mapalab-mcp`, separado del backend principal desde 1.35.0) que expone **6 tools** enfocadas en un solo objetivo: **crear mapas de MapaLab** (con un modelo chico). Cubre búsqueda de capas, retrato de una capa, municipios de Jalisco, features WFS y creación de mapas (panel simple y comparativo swipe). Pensado para clientes LLM (Claude Desktop, IDEs con soporte MCP, agentes como IGIBot) que necesitan entregar mapas como respuesta.

## Por qué un container dedicado

- Los tools son manuales (`@mcp.tool()` en `servers/mapalab.py`), no auto-generados desde routers. Eso da control total sobre nombres, descripciones y qué se expone.
- Reutiliza los servicios y repositorios del backend (`app.services.*`, `app.repositories.*`) — el código de `backend/app` se copia al container del MCP en build time. Sin duplicación de lógica.
- Aislamiento: si un agente abusivo satura el MCP, no impacta al backend del visor que sirve al usuario final.
- Lifecycle propio: `mapalab-mcp` tiene su pool de SQLAlchemy chico (2 workers, 2 conexiones cada uno), separado del pool grande del backend.

## Qué se expone y qué no

6 tools (ver tabla completa más abajo en §Tools y su origen):

| Origen | MCP | Razón |
|---|---|---|
| Búsqueda (`search_layers`) | **sí** (lectura) | Punto de entrada: encuentra el `id` de la capa por texto/slug o lista por `theme` |
| Retrato de capa (`describe_layer`) | **sí** (lectura) | Cualidades + metadata + numeralia + periodicidad de una capa en una sola llamada. Absorbió `get_metadata`, `get_layer_stats` y `get_periodicity` |
| Municipios (`municipios`) | **sí** (lectura) | Lista los 125 o filtra por nombre/clave → claves INEGI para `create_map`/`create_swipe(municipio=...)` |
| Tabla de datos (`layer_table`) | **sí** (lectura) | Filas de una capa con columnas legibles, filtros estructurados, orden y paginación |
| Creación (`create_map`, `create_swipe`) | **sí** (2 writes) | Entregan el mapa: panel simple (`create_map`) o comparativo swipe (`create_swipe`). Idempotentes |
| `get_layer_tree`, `get_initial_order`, `get_sources_batch` | **no** (removido en 1.82.0) | Sin rol en crear mapas; `search_layers`/`describe_layer` cubren lo necesario y el árbol completo es demasiado grande para un modelo chico |
| `measure_geometry` | **no** (removido en 1.82.0) | Utilidad de análisis, no de creación de mapas; 0 uso en telemetría |
| `download` (CSV streaming) | **no** | Streams de `COPY TO STDOUT`; el formato de respuesta MCP no encaja con streaming |
| `shares/{pin,unpin,pin-permanent}` | **no** | Writes administrativos con efectos sobre la BD, no encajan en el patrón del MCP público |
| `metrics`, `health`, `ontoy` | **no** | Endpoints internos de operaciones, no útiles para un agente |

> **Superficie de lectura de `layer_table` (decisión de exposición).** Con el MCP abierto, cualquiera puede leer filas de **cualquier capa publicada en el árbol del visor**, hasta 5000 por consulta filtrada y sin CQL libre. Es intencional: el visor es público y esos datos ya se sirven por WMS/WFS. **Pre-requisito de seguridad:** ninguna capa con datos sensibles o internos debe estar publicada en el árbol (`mapalab.layer_tree_cache`), porque sería alcanzable por aquí. La frontera de exposición es exactamente «lo que el visor ya muestra al público».

## Arquitectura (v1.35.0+)

Desde 1.35.0 el MCP vive en un container dedicado `mapalab-mcp`, separado del backend principal. Sigue el patron estandar de los servers de [`iieg-oficial/agent`](https://github.com/iieg-oficial/agent/tree/main/servers).

```
mapalab-mcp container (servers/mapalab.py)
├── FastMCP("mapalab")
│   ├── @mcp.tool() search_layers, describe_layer, ...   (6 tools)
│   └── mcp_app = mcp.http_app(path='/mcp', stateless_http=True)
│
├── _admin_app: FastAPI
│   ├── GET /          → service info
│   ├── GET /health    → liveness para healthcheck
│   └── GET /metrics   → Prometheus (delegado a app.metrics)
│
└── combined_app: FastAPI (routes=[*_admin_app.routes, *mcp_app.routes])
    ├── lifespan: combine_lifespans(local_lifespan, mcp_app.lifespan)
    │   ├── warmup del pool de SQLAlchemy
    │   ├── flush_loop async de telemetria
    │   └── flush_pending_sync en shutdown
    └── middleware: MCPTelemetryMiddleware(path_prefix='/mcp')

backend container (backend/app/server.py)
└── REST puro: /metadata, /periodicity, /layers, /shares, /download,
    /embed, /metrics, /health, /ontoy. Scheduler + leader election +
    embed quota flush. Sin MCP.
```

El `mapalab-mcp` reutiliza los servicios y repositorios del backend (`app.services.*`, `app.repositories.*`) — el codigo de `backend/app` se copia al container del MCP en build time. Sin duplicacion de logica, ambos containers leen del mismo schema `mapalab` en DataEngine.

### Tools expuestos (7)

Convencion: **todos los tools que reciben una capa usan el `id` del visor** (el que devuelve `search_layers`). El workspace se resuelve solo desde el arbol; no hay que pasarlo.

| Tool | Tipo | Razon |
|---|---|---|
| `search_layers` | Lectura | punto de entrada: busca por texto/id/slug y/o por `theme`. Absorbe los antiguos `search_by_theme` y `resolve_layer_ref` |
| `describe_layer` | Lectura | **retrato completo de una capa**: cualidades (`capabilities`) + metadata + numeralia + periodicidad (años/meses) en una sola llamada. Absorbe `get_metadata`, `get_layer_stats` y `get_periodicity`. Soporta ids difusos |
| `municipios` | Lectura | lista los 125 o busca por nombre/clave. Absorbe `list_municipios` + `resolve_municipios` |
| `layer_table` | Lectura | **tabla de datos** de una capa: columnas con su alias del visor, filtros `{campo, op, valor}`, orden y páginas de hasta 50 filas. Con `coordenadas` agrega un punto lat/lon por fila |
| `layer_stats` | Lectura | **cifras sin descargar elementos**: conteo, suma y promedio de un campo numérico, y reparto por clase. Filtros por `municipio`/`year`. Lo calcula GeoServer |
| `create_map` | **Write** | crea un mapa de un panel y devuelve `{id, kind, url, embed_html, layer?}`. Modo `query`/`theme` (busca) o `layers` (explícito) + `municipio`/`year`/`annotations`/`vista_3d`. Absorbe `make_map` + `create_single_share`. Idempotente |
| `create_swipe` | **Write** | crea un comparativo A\|B (swipe). Modo `layer`+`year_a`+`year_b` (una capa, dos años) o `pane_a_layers`+`pane_b_layers` (dos capas, con `year_a`/`year_b` por lado opcional, validados). Absorbe `create_swipe_share` + `compare_years`. Idempotente |

**Diseño para modelos chicos:** el catálogo se recortó a lo esencial para crear mapas. `describe_layer` evita 3 llamadas (metadata + stats + periodicidad). `create_map`/`create_swipe` separan las dos formas de mapa (un panel vs comparación) con nombres claros, en vez de un god-tool con modos ambiguos. Todos soportan resolución difusa de ids (slug, alias, nombre parcial). Para capas que no soportan filtro por municipio, usá `filtros` en `layer_table` sobre el campo que corresponda. En `create_map`/`create_swipe` los `filters` que mande el cliente se descartan: la fecha va por `year` y el municipio por `municipio`.

**Consolidacion de tools:** de 18 → 15 → 6 tools. Histórico: `search_by_theme`/`resolve_layer_ref` → `search_layers`; `list_municipios`+`resolve_municipios` → `municipios`; `get_workspaces` → dentro de `get_layer_tree` (ya removido). En 1.82.0: `get_metadata`+`get_layer_stats`+`get_periodicity` → `describe_layer`; `make_map`+`create_single_share` → `create_map`; `create_swipe_share`+`compare_years` → `create_swipe`; y se eliminaron `get_layer_tree`, `get_initial_order`, `get_sources_batch` y `measure_geometry` por no aportar al objetivo de crear mapas. Identificadores homologados al `id` del visor.

### Lifespan + middleware

FastMCP necesita su propio lifespan para inicializar el `StreamableHTTP session manager`. Se compone con el lifespan local del MCP server (warmup + flush loop):

```python
app = FastAPI(
    routes=[*_admin_app.routes, *mcp_app.routes],
    lifespan=combine_lifespans(lifespan, mcp_app.lifespan),
)
app.add_middleware(MCPTelemetryMiddleware, path_prefix='/mcp')
```

**Importante**: el middleware se aplica a la `combined_app`, NO a `mcp_app`. Cuando se hace `routes=[*mcp_app.routes]`, los middlewares registrados en `mcp_app` NO se preservan. El middleware filtra por `path_prefix='/mcp'` para no procesar las rutas administrativas.

## Rutas

| Origen | URL canonica |
|---|---|
| Interna (entre containers) | `http://mapalab-mcp:8000/mcp` |
| Local desde host (puerto publicado) | `http://localhost:3006/mcp` |
| Via gateway-hub (produccion) | `https://<dominio>/mapalab/mcp` |

**Sin prefijo `/api`** — el MCP no es REST, es JSON-RPC sobre HTTP streamable. Convive con el API REST del backend en lugar de "dentro" del API. Alineado con la convención dominante en la industria (FastMCP default `path='/mcp'`, Cloudflare remote MCP servers, etc.) y con el patron de `iieg-oficial/agent/servers`. Desde mapalab 1.45.0 las URLs viejas `/api/mcp` y `/mapalab/api/mcp` ya no existen — son 404.

**Sin slash final** — el visor monta `path='/mcp'` (sin slash). Tanto `/mcp` como `/mcp/` funcionan via nginx: hay dos `location =` exactos (sin y con slash) que ambos pegan al backend en `/mcp` sin slash, evitando el 307 que apareceria si el path con slash llegara al mount sin slash.

## Configuración de nginx

`nginx/nginx.conf` define un upstream `mapalab_mcp` separado del `backend` y dos locations dedicadas (`/mcp` y `/mapalab/mcp`, cada una con su variante con/sin slash):

```nginx
upstream mapalab_mcp {
    server mapalab-mcp:8000;
    keepalive 16;
}

location = /mcp {
    proxy_pass http://mapalab_mcp/mcp;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_connect_timeout 10s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
    proxy_buffering off;
    proxy_cache off;
}
```

Diferencias clave contra `/api/`:

- `proxy_buffering off` — sin esto, los eventos SSE se quedan atrapados en el buffer hasta llenarlo.
- `proxy_cache off` — defensivo (no debería haber cache en la zona pero por si se agrega).
- Timeouts de 600s — sesiones MCP pueden mantenerse abiertas.

El gateway-hub no necesita un `location` específico para `/mapalab/mcp/`: cae bajo el bloque general `location ^~ /mapalab/` que ya proxea al `mapalab-nginx`. Si en el futuro se observan problemas de buffering en el gateway, agregar un `location ^~ /mapalab/mcp/` análogo allá con `proxy_buffering off`.

## Tools y su origen

Los 7 tools son manuales (`@mcp.tool()` en `servers/mapalab.py`, capa delgada de registro). La lógica vive dividida por dominio: `servers/resolve.py` (resolución de capas, periodicidad, fechas, búsqueda por tema, municipios), `servers/layers.py` (`describe_layer`, `get_layer_stats`, `resolver_consulta`), `servers/tabla.py` (`layer_table`), `servers/estadisticas.py` (`layer_stats`) y `servers/shares.py` (`create_map`, `create_swipe` + internos). Para cambiar el nombre o el texto que ve un cliente MCP, basta editar la firma del decorador o el docstring de la función en `mapalab.py`.

| Tool | Origen del código | Qué hace |
|---|---|---|
| `search_layers` | `LayersRepository.search_layers` + `find_layer_by_slug_or_alias` + `resolve.search_by_theme` sobre el árbol | Busca por texto/id/slug (`query`) y/o lista un tema (`theme`). Devuelve `{id, label, slug, workspace, path}` |
| `describe_layer` | `servers/layers.py::describe_layer` (metadata + `get_layer_stats` + `resolve._periodicity_summary` + `_capabilities_from_node`) | Retrato completo: `{id, label, path, capabilities, descripcion, fuentes, metodologia, frecuencia, fecha_ultima, metadato_archivos, numeralia, pie_numeralia, periodicidad:{años, meses}}`. Soporta ids difusos |
| `municipios` | `resolve.list_municipios` (todos) o `resolve.resolve_municipios` (substring) | Lista los 125 municipios o filtra por nombre/clave. Devuelve `{items, count}` |
| `layer_table` | `servers/tabla.py::layer_table` (WFS GetFeature con `propertyName`, `sortBy`, `startIndex`) | Filas de una capa. Campos validados contra `DescribeFeatureType`, alias de `atributos.columnas`, solo capas del árbol |
| `layer_stats` | `servers/estadisticas.py::layer_stats` (WFS `resultType=hits` para el conteo; WPS `gs:Aggregate` para suma, promedio y agrupado) | Cifras de una capa: `{layer, filtros, conteo, campo?, suma?, promedio?, agrupado_por?, clases?, otras?}`. `field`/`group_by` se validan contra `DescribeFeatureType` |
| `create_map` | `servers/shares.py::create_map` (modo `query`→`_pick_best_layer`, o `layers`; luego `create_single_share`) | Mapa de un panel. Valida `year` contra la periodicidad. Devuelve `{id, kind, url, embed_html, layer?}` |
| `create_swipe` | `servers/shares.py::create_swipe` (una capa→`compare_years`, o dos capas→`_apply_year_filter` por panel + `create_swipe_share`) | Comparativo A\|B. Devuelve `{id, kind, url, embed_html}` |

**Nota sobre la numeralia (`describe_layer.numeralia`):** `mapalab.layer_stats.values` se persiste como **array plano** `[{posicion, nombre, valor, simbolo}]` (lo escribe `dataengine/jobs/run_refresh_layer_stats.py`). `describe_layer` lo lee por `layer_key = geoserver_workspace:geoserver_layer` vía `get_layer_stats` (`servers/layers.py`). La versión previa consultaba `values->'stats'` con columnas `geoserver_workspace`/`geoserver_layer` inexistentes en la tabla — devolvía vacío siempre (bug corregido en 1.82.0).

## Identificadores de capa (resolución exacta + difusa)

Todos los tools que reciben una capa usan el `id` del visor (el que devuelve `search_layers`). El workspace se resuelve solo desde el árbol; nunca hace falta pasarlo.

Los tools `describe_layer`, `layer_table`, `layer_stats`, `create_map` (modo layers), `create_swipe` (ambos modos) aceptan **ids difusos**: slug, alias o nombre parcial (p. ej. `"homicidio"` resuelve a `homicidio_doloso`). La resolución (`resolve._resolve_layer_fuzzy`) intenta primero el id exacto; si no lo encuentra busca por slug/alias en la BD y por texto en `search_layers`.

## Parámetros acotados (Literal types)

Los parámetros con valores fijos usan `typing.Literal` para que Pydantic rechace valores inválidos de inmediato:

- **Basemaps**: `'voyager'`, `'position'`, `'sin_mapalab'` (NO existe `'osm'`). Aplica en `create_map` y `create_swipe`.
- **Operadores de `layer_table`**: `=`, `!=`, `>`, `>=`, `<`, `<=`, `contiene`.
- **Source en `municipios`**: `'iieg'` o `'inegi'` (validado en `_normalize_municipios`).

Si el modelo manda un valor inválido (p. ej. `basemap="osm"`), Pydantic responde con un error claro: `Input should be 'voyager', 'position' or 'sin_mapalab'`.

## Auto-encuadre de la vista

`create_map` y `create_swipe` no requieren el parámetro `view`. Si se omite:

- Con `municipio` → calcula el bbox del municipio y encuadra automáticamente (zoom proporcional al tamaño).
- Sin `municipio` → vista por defecto de Jalisco: `{zoom: 7.5, lat: 20.6, lon: -103.4}`.

## Tabla de datos (`layer_table`)

Reemplazó a `query_wfs` en 1.203.0. Devuelve filas, no GeoJSON: el agente ve los datos como en la tabla de atributos del visor.

| Parámetro | Qué hace |
|---|---|
| `municipio`, `year`, `month` | igual que en el resto de tools; el servidor arma el CQL. `municipio` necesita `searchMeta.hasMunicipio` |
| `filtros` | hasta 5 `{campo, op, valor}` con `op` en `=`, `!=`, `>`, `>=`, `<`, `<=`, `contiene`, unidos con AND |
| `columnas` | campos a mostrar (máximo 20); vacío = las visibles de `atributos.columnas`, en su orden |
| `orden`, `descendente` | `sortBy` de GeoServer |
| `pagina`, `por_pagina` | 1–50 filas por página; la tabla llega hasta la fila 5000 |
| `coordenadas` | agrega `{lat, lon}` del centro de cada elemento |

Respuesta: `{capa, nombre, total, pagina, paginas, columnas: [{campo, etiqueta}], filas, columnas_omitidas?, orden?}`. Las filas usan la `etiqueta` (el alias de `/metadata/columnas`) como llave; los filtros usan el `campo` crudo. El formato `anio` recorta la fecha al año, igual que la tarjetita.

**Cómo se arma sin CQL libre.** `campo` se valida contra `DescribeFeatureType` (el error lista los válidos) y nunca contra texto del cliente; los valores de texto se escapan (`'` → `''`), los numéricos se convierten a `float`, y `contiene` solo aplica a texto. Ya no existe un parámetro de CQL crudo.

**Gotchas que salieron al probarla contra sextante:**

- GeoServer **no pagina sin orden** en tablas sin llave primaria (`Cannot do natural order without a primary key`). Sin `orden`, la consulta ordena por la primera columna: además la paginación queda estable.
- Las capas tienen `numDecimals=0`: pedidas en EPSG:4326 salen redondeadas a grados enteros. Por eso las coordenadas se piden en EPSG:6368 y el centro se convierte en PostGIS, en una sola consulta.
- `resolver_consulta` (compartido con `layer_stats`) aplica el `cqlFilter` base de la capa y prefiere `wfsLayerName`, igual que el visor. Antes de 1.203.0 no lo hacía: `bachillerato` contaba **todos** los centros educativos. Una capa con `wfsAvailable: false` se rechaza.

Techo global de 60 consultas por minuto y 5000 al día (`techo_tabla`), y los campos de cada capa se guardan 10 minutos.

## Blindaje de la escritura (`create_map` / `create_swipe`)

Son los únicos tools que escriben. Lo que entra se limpia en `servers/blindaje.py` antes de llegar a `validate_payload`:

| Qué | Regla |
|---|---|
| Capas | se resuelven contra el catálogo con `_resolve_layer_fuzzy`; una que no existe se rechaza |
| `filters` del cliente | se descartan; solo quedan los que arma el servidor (`year`, `municipio`) |
| `selected` | debe ser una de las capas del mapa |
| `view` | `lat` 17–24.5, `lon` −107.5 – −99.5, `zoom` 1–20, `rotation` ±360 |
| Textos | `label_a`/`label_b` hasta 60 caracteres; `id`, `label`, `unit`, `textLabel` de cada anotación hasta 200. Las anotaciones pierden los campos desconocidos |
| Volumen | techo **global** de 30 compartidos por minuto y 2000 al día (`techo_compartidos`) |

El techo es global y no por persona: el borde entrega todo el tráfico con una sola IP y el MCP corre en modo `stateless_http`, sin sesión que distinguir. Los compartidos idénticos no se duplican: el id es un hash del contenido.

`layer_stats` tiene su propio techo para WPS (`techo_wps`: 20 por minuto, 500 al día), porque GeoServer limita `wps.execute` a 1000 al día para todo el sitio, y guarda los resultados 10 minutos. El conteo simple va por WFS `hits` y no gasta ese techo.

## Nota para modelos LLM chicos (Qwen 3B self-host)

El servidor incluye `instructions` a nivel FastMCP con un playbook corto que el modelo ve al inicializar. `describe_layer` reduce round-trips (metadata + numeralia + periodicidad en una llamada) y `create_map` entrega el mapa en un paso desde una búsqueda por texto.

**Modo Vista por municipio.** `create_map` y `create_swipe` aceptan `municipio` (nombre o clave); internamente se normaliza a `{source:"iieg", selected:[clave]}`. El validador del share (`share_service._validate_municipios`) limita a 125 claves. Cuando se abre el share, el visor activa el modo: máscara visual oscura fuera del polígono, filtro CQL `{municipioField} IN (...)` automático en capas que lo soporten. Ver `docs/municipio-mode.md` para el flujo completo.

Patrón típico desde un agente:

```
1. municipios(query="guadalajara") → [{clave:"14039",nombre:"Guadalajara"}]
2. create_map(query="tasa_homicidio_doloso", municipio="Guadalajara")
3. → embed_html con el visor filtrado a ese municipio
```

## Entrega de mapas a agentes conversacionales

Dos tools de escritura para que agentes LLM (p. ej. IGIBot) entreguen mapas interactivos en respuesta a preguntas del usuario, no solo descripciones de texto:

### `create_map`

```
create_map(
    query: str = '',                 # modo busqueda: elige la mejor capa
    layers: list | None = None,      # modo directo: IDs del visor o {slug, opacity?, filters?}
    municipio: str | None = None,    # nombre o clave; filtra + auto-encuadra
    year: str | None = None,         # validado contra la periodicidad de la capa
    theme: str = '',                 # busqueda por area tematica
    view: dict | None = None,        # {zoom, lat, lon}; auto-encuadre si se omite
    basemap: str | None = None,
    selected: str | None = None,
    annotations: list | None = None, # GeoJSON EPSG:4326
    vista_3d: dict | None = None,    # {inclinacion?, rumbo?, exageracion?, extruir?}
) -> {id, kind, url, embed_html, layer?}
```

Crea un share `kind='single'` y devuelve:

- `id`: hash corto de 10 chars (`qd6fj67ex3`)
- `url`: enlace directo al visor (`https://iieg.gob.mx/mapalab/mapa?s=...`)
- `embed_html`: snippet `<script>...</script><iieg-mapalab share="...">` listo para pegar en cualquier sitio que cargue el widget
- `layer`: `{id, label}` de la capa elegida (solo en modo `query`/`theme`)

El bot pega el `embed_html` en su respuesta markdown; el navegador del usuario monta el widget. La key publica `mk_pub_...` la sustituye el bot con la que IIEG le haya asignado. `annotations` permite pre-pintar lineas/poligonos/textos/emojis (mismo schema que `payload.annotations`, ver `docs/swipe.md §Annotations`).

### `create_swipe`

```
create_swipe(
    layer, year_a, year_b,           # modo una-capa: misma capa, dos años
    pane_a_layers, pane_b_layers,    # modo dos-capas: dos sets de capas
    municipio: str | None = None,    # year_a/year_b también filtran cada lado
    position: float = 0.5,           # 0.05 .. 0.95
    view, basemap, label_a, label_b,
    annotations: list | None = None,
    vista_3d: dict | None = None,
) -> {id, kind, url, embed_html}
```

Crea un share `kind='swipe'` con separador arrastrable A\|B. Modo **una capa** (`layer`+`year_a`+`year_b`) para "antes vs después" de una misma capa; modo **dos capas** (`pane_a_layers`+`pane_b_layers`) para "compara robo vs homicidio", donde `year_a`/`year_b` opcionalmente filtran cada lado. En ambos modos el server arma y valida los filtros de fecha contra la periodicidad — el agente nunca escribe CQL.

### `vista_3d`

`create_map` y `create_swipe` aceptan `vista_3d` para que el `url` abra en la vista 3D con relieve:

| Campo | Rango | Default |
|---|---|---|
| `inclinacion` | 0–80 grados | 55 |
| `rumbo` | −180 a 180 grados desde el norte | 0 |
| `exageracion` | 1–5 | 1.5 |
| `extruir` | hasta 10 ids, **de capas del mapa** | `[]` |

Se valida con el modelo `Vista3d` de `servers/blindaje.py` y se guarda como `payload.vista3d` (o `payload.shared.vista3d` en un swipe), el mismo campo que escribe el visor al compartir desde 3D; ver `docs/swipe.md §Share envelope`. El `embed_html` sigue abriendo en 2D: el widget no monta la vista 3D.

### Patron de uso desde un agente

```
1. usuario: "muestrame los homicidios en Guadalajara"
2. agente: search_layers(query="homicidio")     -> id "tasa_homicidio_doloso"
3. agente: describe_layer("tasa_homicidio_doloso")   # cualidades + años + numeralia
4. agente: create_map(query="tasa_homicidio_doloso", municipio="Guadalajara")
5. agente: responde con texto + embed_html del share
```

El usuario ve un mapa interactivo embebido y puede guardar su propia copia desde el boton "Compartir".

## Identificadores: solo el `id` del visor

**Regla única:** todo tool que recibe una capa usa el `id` que devuelve `search_layers` (p. ej. `homicidio_doloso`). El agente nunca necesita el `geoserver_workspace`/`geoserver_layer` ni armar `ws:layer` — el MCP lo resuelve solo desde el árbol (`resolve._resolve_layer_fuzzy`). Esto simplifica el flujo `search_layers → describe_layer/layer_table → create_map/create_swipe` y es clave para agentes pequeños (p. ej. un Qwen 3B self-host).

`describe_layer`, `layer_table` y `layer_stats` reciben solo `layer=<id>`; el workspace se deriva del árbol. `describe_layer.periodicidad` resume las fechas disponibles a `{años, meses}`.

## Cómo probar

### Inspector oficial (lo más rápido)

```bash
npx @modelcontextprotocol/inspector
```

Browser en `http://localhost:6274` → Transport `Streamable HTTP` → URL `http://localhost:3006/mcp/` → Connect → tab Tools → List/Run.

### Cliente Python con FastMCP

```python
import asyncio, json
from fastmcp import Client

async def main():
    async with Client('http://localhost:3006/mcp/') as client:
        tools = await client.list_tools()
        print(f'{len(tools)} tools')
        for t in tools:
            print(' -', t.name)

        result = await client.call_tool('search_layers', {'query': 'homicidio'})
        print(json.dumps(result.data, indent=2)[:500])

asyncio.run(main())
```

### Cliente Python con LangChain MCP adapters

```python
import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient

async def main():
    client = MultiServerMCPClient({
        'mapalab': {
            'transport': 'streamable_http',
            'url': 'http://localhost:3006/mcp/',
        }
    })
    tools = await client.get_tools()
    print([t.name for t in tools])

asyncio.run(main())
```

### Claude Desktop

`~/.config/Claude/claude_desktop_config.json` (Linux) o equivalente:

```json
{
  "mcpServers": {
    "mapalab": {
      "url": "http://localhost:3006/mcp/",
      "transport": "http"
    }
  }
}
```

Reiniciar Claude Desktop. Los tools aparecen en el panel de herramientas del chat.

### curl (handshake)

```bash
curl -i -N -X POST http://localhost:3006/mcp/ \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": {"name": "curl", "version": "0"}
    }
  }'
```

### curl (tools/list)

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Devuelve los 6 tools registrados con su `name`, `description` y `inputSchema`.

### curl (`tools/call`) — pruebas rápidas

Las respuestas vienen en formato SSE (`event: message\ndata: {...}`). Para parsearlas con `jq`, pipea con `sed 's/^data: //' | tail -1 | jq` o similar.

**`create_map`** — modo búsqueda, con municipio y anotación:

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_map",
      "arguments": {
        "query": "tasa_homicidio_doloso",
        "municipio": "Guadalajara",
        "basemap": "voyager",
        "annotations": [{
          "id": "zona1",
          "type": "Polygon",
          "geometry": {"type":"Polygon","coordinates":[[
            [-103.4,20.6],[-103.3,20.6],[-103.3,20.7],[-103.4,20.7],[-103.4,20.6]
          ]]},
          "label": "Zona analizada"
        }]
      }
    }
  }'
```

Devuelve `{id, kind, url, embed_html, layer?}`. Pegar `url` en un navegador abre el visor configurado; pegar `embed_html` en una página renderiza el mapa embebido.

**`create_swipe`** — comparación temporal (modo años):

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 2,
    "method": "tools/call",
    "params": {
      "name": "create_swipe",
      "arguments": {
        "layer": "homicidio_doloso",
        "year_a": "2024",
        "year_b": "2023",
        "municipio": "Guadalajara"
      }
    }
  }'
```

**`create_swipe`** — dos capas distintas, un año por lado, mapa gris:

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 3,
    "method": "tools/call",
    "params": {
      "name": "create_swipe",
      "arguments": {
        "pane_a_layers": ["robos_casa_habitacion_con_violencia"],
        "pane_b_layers": ["homicidio_doloso"],
        "year_a": "2026",
        "year_b": "2025",
        "basemap": "position",
        "label_a": "Robo casa habitación",
        "label_b": "Homicidio doloso"
      }
    }
  }'
```

El server arma y valida los filtros de fecha de cada lado contra la periodicidad; el agente no escribe CQL.

### Playground del admin Mariachi

`/administrador/documentacion` tab "Servidor MCP" expone un playground con botón "Probar" por tool — los writes (`create_map`, `create_swipe`) se llaman via `tools/call` JSON-RPC al endpoint `/mcp/`; los de lectura contra sus equivalentes.

Respuesta esperada: `200 OK` con `Content-Type: text/event-stream` y un evento `data:` con `serverInfo: {"name": "MapaLab MCP", ...}`.

## Recetas — combinaciones reales de tools

El flujo típico de un agente es `search_layers` / `describe_layer` para conocer la capa y luego `create_map` o `create_swipe` para entregar el mapa.

### Guía rápida

- **Basemaps válidos**: `"voyager"` (recomendado), `"position"`, `"sin_mapalab"`. No uses `"osm"` — no existe.
- **Años disponibles**: `describe_layer(...).periodicidad.años`. `create_map(year=...)` y `create_swipe(year_a/year_b=...)` validan el año contra la periodicidad y devuelven error accionable si no existe.
- **Municipios**: pasá el nombre o la clave directo (`municipio: "Guadalajara"` o `"14039"`); el MCP resuelve la clave INEGI y auto-encuadra. `municipios(query=...)` sirve para buscar la clave si la necesitás.
- **Capas en `create_map`**: modo búsqueda (`query`/`theme`) o directo (`layers`: string id u objeto `{slug, opacity?, filters?}`).
- **Anotaciones**: tipos `LineString`, `Polygon`, `Emoji` (con `textLabel`), `Text`. En swipe son globales (ambos lados).

### Receta 0 — Capa temporal en un municipio, en un paso

**Escenario:** "homicidios 2025 en Guadalajara".

```
1. describe_layer("homicidio")  → id "homicidio_doloso", periodicidad.años incluye 2025, hasMunicipio=true
2. create_map(query="homicidio_doloso", year="2025", municipio="Guadalajara")
3. → {id, url, embed_html, layer}
```

`create_map` busca la capa, valida el año, arma el filtro de fecha, resuelve la clave del municipio y auto-encuadra. Un solo round-trip para entregar.

### Receta 1 — Mapa directo con capas y anotación

**Escenario:** el agente ya resolvió las capas y quiere resaltar una zona.

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_map",
      "arguments": {
        "layers": ["tasa_homicidio_doloso"],
        "basemap": "voyager",
        "annotations": [{
          "id": "area-norte",
          "type": "Polygon",
          "geometry": {"type":"Polygon","coordinates":[[
            [-103.39,20.70],[-103.32,20.70],[-103.32,20.75],[-103.39,20.75],[-103.39,20.70]
          ]]},
          "label": "Área norte"
        }]
      }
    }
  }'
```

Devuelve `{id, kind, url, embed_html}`. Sin `view`, se auto-encuadra a Jalisco (o al municipio si lo pasás).

### Receta 2 — Comparación temporal (swipe por años)

**Escenario:** "compara homicidios 2024 vs 2023 en Guadalajara".

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_swipe",
      "arguments": {
        "layer": "homicidio_doloso",
        "year_a": "2024",
        "year_b": "2023",
        "municipio": "Guadalajara"
      }
    }
  }'
```

El visor abre con la barra arrastrable: A = 2024, B = 2023. Las etiquetas se arman solas (`<label> <año>`).

### Receta 3 — Comparación libre (swipe de dos capas)

**Escenario:** "compara la tasa de homicidio contra la población".

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_swipe",
      "arguments": {
        "pane_a_layers": ["tasa_homicidio_doloso"],
        "pane_b_layers": ["poblacion"],
        "position": 0.5,
        "label_a": "Homicidio",
        "label_b": "Población",
        "annotations": [
          {"id":"pin","type":"Emoji","geometry":{"type":"Point","coordinates":[-103.349,20.677]},"textLabel":"📍"}
        ]
      }
    }
  }'
```

Las anotaciones en swipe son globales (visibles sobre ambos paneles): son del nivel del mapa, no de un slot (ver `docs/swipe.md §Pendientes`).

## Telemetría → Mariachi (v1.30.0+)

Cada request HTTP al `/mcp/` pasa por `MCPTelemetryMiddleware` (ASGI puro en `backend/app/middleware/mcp_telemetry.py`) que parsea el JSON-RPC, mide duración + bytes de salida y empuja al buffer del `_McpTelemetryLogger`. Un loop async flushea cada 30s a `POST /api/administrador/internal/mapalab/mcp/events` en mariachi (mismo patrón que `access_logger` / `api_key_quota`).

**Campos persistidos** (tabla `mapalab_mcp_events` en mariachi):

| Campo | Origen |
|---|---|
| `timestamp`, `dia` | reloj del backend al recibir |
| `method` | `method` del JSON-RPC (`initialize`, `tools/list`, `tools/call`, `notifications/initialized`, …) |
| `tool` | `params.name` cuando `method == "tools/call"` |
| `status` | `ok` si HTTP < 400, `error` si ≥ 400 |
| `error_code` | status HTTP cuando hay error |
| `duration_ms` | `time.monotonic` antes/después del downstream |
| `bytes_out` | suma de chunks del response (incluye SSE) |
| `session_hash` | SHA-256(salt + `mcp-session-id`) |
| `ip_hash` | SHA-256(salt + IP del cliente) |
| `client_name`, `client_version` | `params.clientInfo` extraído en `initialize` |

`salt = MAPALAB_INTERNAL_TOKEN`. Sin identidad: no se guarda IP plana ni session id en claro.

**Lo que NO captura** (a propósito):
- Errores JSON-RPC dentro de respuestas SSE 200 OK (parsearías el stream y rompería el transport). Si el error sube como HTTP ≥ 400, sí se ve.
- Argumentos del tool. Si en el futuro se quiere registrar `q` de `search_layers` para analytics, agregar un campo opcional `args_summary` y popularlo en `_safe_parse_jsonrpc` con scrubbing PII.

**Piezas**:

| Repo | Archivo | Rol |
|---|---|---|
| mapalab | `backend/app/middleware/mcp_telemetry.py` | Middleware ASGI montado en `mcp_app` |
| mapalab | `backend/app/services/mcp_telemetry.py` | Logger en memoria + flush loop async |
| mapalab | `backend/app/server.py` | Aplica middleware, lanza flush loop, flushea on shutdown |
| mariachi | `api/app/models/mapalab_mcp_event.py` | Modelo SQLAlchemy `MapalabMcpEvent` |
| mariachi | `api/app/schemas/mapalab_mcp.py` | Pydantic batch schema |
| mariachi | `api/app/api/routes/mapalab_mcp_internal.py` | `POST /internal/mapalab/mcp/events` (X-Internal-Token) |
| mariachi | `api/alembic/versions/mariachi/b9c0d1e2f3a5_add_mapalab_mcp_events.py` | Migración + 4 índices |

### Auditoría por key (retirada en 1.202.0)

Hasta 1.201.0 cada `tools/call` se registraba atribuido a la API key en `mapalab_api_keys_accesos`, la tabla de Auditoría de las llaves. Sin key ya no hay a quién atribuirlo: el uso del MCP queda solo en la telemetría anónima de arriba. El `access_flush_loop` sigue arrancando en el lifespan porque es el mismo logger del widget.

### Vistas materializadas + dashboard (v1.34.0)

4 vistas materializadas alimentan el tab MCP de `/administrador/mapalab/stats`:

| Vista | Contenido |
|---|---|
| `mapalab_mcp_stats_overview` | calls_30d/7d/1d, errors_30d, sessions_30d, clients_30d, avg_tool_duration_ms, tool_calls_30d |
| `mapalab_mcp_stats_tools` | uses, errors, unique_sessions, avg/p95 duration_ms, last_seen — agrupado por tool (30 d) |
| `mapalab_mcp_stats_daily` | calls, tool_calls, errors, unique_sessions, avg_duration_ms — agrupado por día (90 d) |
| `mapalab_mcp_stats_clients` | calls, unique_sessions, last_seen — agrupado por client_name + client_version (30 d) |

Las cuatro están en el array `REFRESH_VIEWS` de `mariachi/api/app/services/mapalab_telemetry.py` y se refrescan con el mismo botón "Refrescar vistas" del tab Resumen. `mapalab_mcp_stats_overview` no tiene índice único (lista a parte) y se refresca sin `CONCURRENTLY` igual que `mapalab_stats_overview`.

**Endpoints** (admin-only, mismo prefix `/api/administrador/mapalab-stats`):
- `GET /mapalab-stats/mcp/overview`
- `GET /mapalab-stats/mcp/tools?limit=30`
- `GET /mapalab-stats/mcp/daily?days=30`
- `GET /mapalab-stats/mcp/clients`

### Métricas Prometheus + alertas (v1.34.0)

`MCPTelemetryMiddleware` también emite a Prometheus en paralelo:

| Métrica | Tipo | Labels | Cuándo |
|---|---|---|---|
| `mapalab_mcp_calls_total` | counter | `method`, `tool`, `status` | cada request HTTP al `/mcp/` |
| `mapalab_mcp_latency_ms` | histograma | `tool` | sólo `tools/call` con tool conocido |

Scrapeado por Prometheus en huachicol vía el endpoint `/metrics` existente del backend. Dos alertas nuevas en `huachicol/prometheus/rules/alerts.yml`:

| Alerta | Trigger |
|---|---|
| `MapalabMcpHighErrorRate` | >10 % de status=error en 10 min con tráfico sostenido (>0.05 rps) |
| `MapalabMcpHighLatency` | p95 del tool > 5 s en 10 min con tráfico sostenido |

## Acceso y seguridad

Desde **1.202.0** el MCP es **abierto**: no pide API key. Entre 1.33.0 y 1.201.0 todo `/mcp` exigía `Authorization: Bearer mk_...` (`servers/auth.py`, validado contra mariachi, con cuota por key); se retiró para que se conecte como conector personalizado de claude.ai, cuya UI web no tiene campo para una key estática.

Conectar un cliente:

```bash
claude mcp add --transport http mapalab https://iieg.jalisco.gob.mx/mapalab/mcp
```

Lo que protege al servicio sin key:

| Frente | Cómo |
|---|---|
| Escritura (`create_map`, `create_swipe`) | blindaje de la entrada y techo global de 30/min y 2000/día (ver «Blindaje de la escritura») |
| WPS de GeoServer (`layer_stats`) | techo global de 20/min y 500/día, caché de 10 min |
| Flood | `limit_req`/`limit_conn` del nginx (abajo) |

Los techos son **globales**: el borde entrega todo el tráfico con una sola IP, así que un límite «por IP» es de hecho un límite para todo el sitio. Lo mismo vale para las zonas del nginx.

### Rate limit + connection limit en nginx

`nginx/nginx-main.conf` define las zonas y `nginx/nginx.conf` las aplica a los 4 bloques `location` de `/mcp` (`/mcp`, `/mcp/`, `/mapalab/mcp`, `/mapalab/mcp/`):

```nginx
# nginx-main.conf (http {})
limit_req_zone  $binary_remote_addr zone=mcp_req:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=mcp_conn:10m;
limit_req_status 429;
limit_conn_status 429;

# nginx.conf (cada location /mcp)
limit_req  zone=mcp_req burst=20 nodelay;
limit_conn mcp_conn 10;
```

Corta floods antes de que lleguen al pool chico del MCP (2 workers × 2 conexiones). El burst de 20 absorbe el arranque normal de una sesión MCP (initialize + tools/list + varias tools/call).

### Piezas

| Archivo | Rol |
|---|---|
| `servers/blindaje.py` | Limpieza de la entrada de los compartidos y la clase `Techo` |
| `servers/estadisticas.py` | `techo_wps` y caché de `layer_stats` |
| `nginx/nginx-main.conf`, `nginx/nginx.conf` | Zonas y directivas `limit_req`/`limit_conn` |

## Versiones

- `fastmcp ≥ 3.2.4` (requirement sin pin para acompañar updates)
- `mcp ≥ 1.27.0` (instalado transitivamente por fastmcp)
- Protocolo MCP: `2025-06-18`

`combine_lifespans` vive en `fastmcp.utilities.lifespan` desde fastmcp 2.x. Si en el futuro se actualiza fastmcp y desaparece el path, hay que migrar al patrón de `mcp_app.router.lifespan_context`.

## Cómo agregar un tool al MCP

1. Definir la función en `servers/mapalab.py` decorada con `@mcp.tool()`. Argumentos tipados con `Field(description=...)` para que la descripción aparezca en `tools/list`. Docstring en español (es el "summary" que ven los clientes MCP).
2. Si la lógica es trivial (lectura directa), implementarla inline. Si reutiliza servicios del backend (medición, share, etc.), importar desde `app.services.*` o `app.repositories.*`.
3. Para tools de share, ya existe `servers/shares.py` con helpers compartidos (`_persist_share`, `_normalize_layer_entries`, etc.) — extender ahí si aplica. Los helpers de resolución de capas/periodicidad viven en `servers/resolve.py` y los de lectura (metadata/stats/wfs) en `servers/layers.py`.
4. Rebuild del container MCP: `docker compose build mapalab-mcp && docker compose up -d mapalab-mcp`.
5. Validar: `curl -s -X POST $URL -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | jq '.result.tools | length'` debería incrementarse.

## Cómo quitar un tool

1. Removerlo de `servers/mapalab.py` (el `@mcp.tool()` completo).
2. Si la función auxiliar no se usa en otro lado, limpiarla también.
3. Si era un wrapper de un endpoint REST, **mantener** el endpoint REST original — el visor o mariachi lo siguen usando. Solo cambia la exposición al MCP.
4. Rebuild + verificar count en `tools/list`.

## Limitaciones conocidas

- **`download` queda fuera**: no es trivial exponer un stream de CSV como tool MCP. Si se requiere, considerar un endpoint alternativo que devuelva una URL firmada (S3/Acervo) en lugar del stream directo.
- **Timeout en queries PostGIS**: la conversión de coordenadas de `layer_table` se hace en una sola query (no N+1). La numeralia de `describe_layer` es un `SELECT` plano sobre `mapalab.layer_stats` (sin PostGIS).
- **`filters.date` (CQL) sin validar server-side** (pendiente, M2): el share persiste el CQL verbatim y el visor lo reenvía a GeoServer en `CQL_FILTER`. Validar contra la forma esperada (`parseCQLToSelections`/`generateCQLFilter`) en `servers/shares.py`.
- **Techos aproximados por multiproceso**: en producción el MCP corre con `gunicorn --workers ${MCP_WORKERS}` (hoy **2**). Los `Techo` de `servers/blindaje.py` viven en memoria **por proceso**, así que el techo efectivo es ≈ `MCP_WORKERS ×` el configurado (60/min y 4000/día de compartidos con dos workers). Para un tope exacto hay que mover el contador a Redis.
- **IP de `ips_permitidas` solo confiable en deploy directo**: el MCP toma el IP de `X-Real-IP` (lo fija el nginx inmediato, sobrescribiendo lo que mande el cliente; ya no se usa el primer `X-Forwarded-For` que era spoofeable). Detrás del gateway, `X-Real-IP` es la IP del gateway, no la del cliente final, así que el allowlist por IP de una key privada no discrimina por cliente en ese trayecto. Para keys de MCP, apóyate en el secreto de la key + cuota, no en `ips_permitidas`. Para habilitar allowlist por cliente detrás del gateway, mapalab-nginx debería propagar el `X-Real-IP` que ya calcula el gateway en vez de sobrescribirlo.
- **Sin observabilidad propia**: las llamadas a tools no aparecen en `/metrics` (excluido) ni se loggean separadas. Para monitorear, mirar logs de uvicorn/gunicorn filtrando por `/mcp/`.

## Pendiente — Publicar en el Claude Connectors Directory ("store")

> **Estado: no iniciado.** Desde 1.202.0 el MCP es abierto y funciona como *conector personalizado* en claude.ai, Claude Code y Desktop sin configurar nada más. Para entrar al **Connectors Directory** (el listado oficial, "store") faltan los puntos de abajo.

### Por qué no entra hoy

| Camino | Auth aceptada | Estado mapalab |
|---|---|---|
| Conector personalizado (URL pegada por el usuario) | OAuth, o sin auth. La UI web de claude.ai **no** tiene campo para API key estática | Funciona sin auth desde 1.202.0 |
| **Connectors Directory** (listado oficial) | **OAuth 2.1 + PKCE obligatorio** | Falta todo lo de OAuth, si el directorio no admite servidores abiertos |

### Fase 1 — OAuth 2.1 (el 90 % del esfuerzo)

Agregar un flujo OAuth 2.1 (el gate de API key se retiró en 1.202.0). **No** implementar OAuth a mano: delegar en **Minerva** (proyecto SSO con Authentik + OIDC; ver `gateway-hub/docs/minerva.md`), que puede actuar como Authorization Server con DCR.

Requisitos del MCP como *Resource Server*:

- [ ] `GET /.well-known/oauth-protected-resource` en el `combined_app` — apunta al issuer de Minerva/Authentik.
- [ ] El Authorization Server (Minerva/Authentik) expone `/.well-known/oauth-authorization-server` y soporta **PKCE (S256)** y **Dynamic Client Registration** (o CIMD).
- [ ] Registrar el redirect URI de Claude: `https://claude.ai/api/mcp/auth_callback`.
- [ ] Un middleware valida el **access token OAuth** (JWT firmado por Authentik).
- [ ] Mapear identidad OAuth → cuota, si se quiere volver a limitar por cliente y no solo con los techos globales.
- [ ] Validación del header `Origin` en las requests a `/mcp`.

### Fase 2 — Anotaciones de los 6 tools

El directorio exige que cada tool declare metadata (hoy `servers/mapalab.py` solo tiene docstrings):

- [ ] `title` legible por tool.
- [ ] `readOnlyHint=True` en los 4 de lectura.
- [ ] `readOnlyHint=False` (o `destructiveHint`) en los 2 writes (`create_map`, `create_swipe`).
- [ ] En FastMCP: `@mcp.tool(annotations=ToolAnnotations(title=..., readOnlyHint=True))`.

### Fase 3 — Assets y submission

- [ ] **HTTPS** — ✅ ya cubierto vía gateway (`iieg.jalisco.gob.mx/mapalab/mcp`).
- [ ] **Privacy policy** con URL pública estable: qué datos se recopilan (la telemetría guarda `session_hash`/`ip_hash`, sin IP en claro), uso, retención, contacto.
- [ ] Branding: logo del servidor, favicon verificable, 3–5 screenshots (≥1000px).
- [ ] Documentación pública del conector + cuenta de prueba con datos de ejemplo y guía paso a paso para los revisores de Anthropic.
- [ ] Checklist de políticas y términos del Software Directory de Anthropic.

### Referencias de submission

- [Submitting to the Connectors Directory](https://claude.com/docs/connectors/building/submission)
- [Remote MCP Server Submission Guide](https://support.claude.com/en/articles/12922490-remote-mcp-server-submission-guide)
- Decisión de alcance: si el uso es solo interno/IGIBot, **no** vale la pena la Fase 1 — basta el conector personalizado con header. El directorio solo aplica si se quiere distribución pública en claude.ai.

## Referencias

- [FastMCP docs — Integración con FastAPI](https://gofastmcp.com/integrations/fastapi)
- [FastMCP docs — Lifespan](https://gofastmcp.com/servers/lifespan)
- Skill `fastapi-to-mcp` del repositorio central de contexto (`.claude/skills/fastapi-to-mcp/`) — guía que se usó como base
- `backend/app/server.py` — implementación
- `nginx/nginx.conf` — bloques `location = /mcp[/]` y `location = /mapalab/mcp[/]`
