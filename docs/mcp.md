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
| Features (`query_wfs`) | **sí** (lectura) | Features WFS reales de una capa (geometrías/valores) con filtros por municipio/año o CQL |
| Creación (`create_map`, `create_swipe`) | **sí** (2 writes) | Entregan el mapa: panel simple (`create_map`) o comparativo swipe (`create_swipe`). Idempotentes |
| `get_layer_tree`, `get_initial_order`, `get_sources_batch` | **no** (removido en 1.82.0) | Sin rol en crear mapas; `search_layers`/`describe_layer` cubren lo necesario y el árbol completo es demasiado grande para un modelo chico |
| `measure_geometry` | **no** (removido en 1.82.0) | Utilidad de análisis, no de creación de mapas; 0 uso en telemetría |
| `download` (CSV streaming) | **no** | Streams de `COPY TO STDOUT`; el formato de respuesta MCP no encaja con streaming |
| `shares/{pin,unpin,pin-permanent}` | **no** | Writes administrativos con efectos sobre la BD, no encajan en el patrón del MCP público |
| `metrics`, `health`, `ontoy` | **no** | Endpoints internos de operaciones, no útiles para un agente |

> **Superficie de lectura de `query_wfs` (decisión de exposición).** A diferencia del resto de tools (metadata/árbol curados), `query_wfs` deja que el agente corra CQL arbitrario y baje hasta 10 000 features completos de **cualquier capa publicada en el árbol del visor**. Esto es intencional: el visor de MapaLab es público y esos features ya se sirven vía WMS/WFS al frontend. **Pre-requisito de seguridad:** ninguna capa con datos sensibles/internos debe estar publicada en el árbol del visor (`mapalab.layer_tree_cache`), porque sería alcanzable por aquí. El tool solo resuelve capas presentes en el árbol (`find_node` sobre el tree cache), así que la frontera de exposición es exactamente "lo que el visor ya muestra al público".

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
| `query_wfs` | Lectura | features WFS de una capa con filtros por `municipio`/`year`/`month` o CQL |
| `layer_stats` | Lectura | **cifras sin descargar elementos**: conteo, suma y promedio de un campo numérico, y reparto por clase. Filtros por `municipio`/`year`. Lo calcula GeoServer |
| `create_map` | **Write** | crea un mapa de un panel y devuelve `{id, kind, url, embed_html, layer?}`. Modo `query`/`theme` (busca) o `layers` (explícito) + `municipio`/`year`/`annotations`. Absorbe `make_map` + `create_single_share`. Idempotente |
| `create_swipe` | **Write** | crea un comparativo A\|B (swipe). Modo `layer`+`year_a`+`year_b` (una capa, dos años) o `pane_a_layers`+`pane_b_layers` (dos capas, con `year_a`/`year_b` por lado opcional, validados). Absorbe `create_swipe_share` + `compare_years`. Idempotente |

**Diseño para modelos chicos:** el catálogo se recortó a lo esencial para crear mapas. `describe_layer` evita 3 llamadas (metadata + stats + periodicidad). `create_map`/`create_swipe` separan las dos formas de mapa (un panel vs comparación) con nombres claros, en vez de un god-tool con modos ambiguos. Todos soportan resolución difusa de ids (slug, alias, nombre parcial). Para capas que no soportan filtro por municipio, usá `cql_filter` en `query_wfs`. En `create_map`/`create_swipe` los `filters` que mande el cliente se descartan: la fecha va por `year` y el municipio por `municipio`.

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

Los 7 tools son manuales (`@mcp.tool()` en `servers/mapalab.py`, capa delgada de registro). La lógica vive dividida por dominio: `servers/resolve.py` (resolución de capas, periodicidad, fechas, búsqueda por tema, municipios), `servers/layers.py` (`describe_layer`, `get_layer_stats`, `query_wfs`) y `servers/shares.py` (`create_map`, `create_swipe` + internos). Para cambiar el nombre o el texto que ve un cliente MCP, basta editar la firma del decorador o el docstring de la función en `mapalab.py`.

| Tool | Origen del código | Qué hace |
|---|---|---|
| `search_layers` | `LayersRepository.search_layers` + `find_layer_by_slug_or_alias` + `resolve.search_by_theme` sobre el árbol | Busca por texto/id/slug (`query`) y/o lista un tema (`theme`). Devuelve `{id, label, slug, workspace, path}` |
| `describe_layer` | `servers/layers.py::describe_layer` (metadata + `get_layer_stats` + `resolve._periodicity_summary` + `_capabilities_from_node`) | Retrato completo: `{id, label, path, capabilities, descripcion, fuentes, metodologia, frecuencia, fecha_ultima, metadato_archivos, numeralia, pie_numeralia, periodicidad:{años, meses}}`. Soporta ids difusos |
| `municipios` | `resolve.list_municipios` (todos) o `resolve.resolve_municipios` (substring) | Lista los 125 municipios o filtra por nombre/clave. Devuelve `{items, count}` |
| `query_wfs` | `servers/layers.py::query_wfs` (GeoServer WFS GetFeature) | Features de una capa con filtros por `municipio`/`year`/`month` o CQL. Workspace resuelto por `id`. Sanitiza SQLi, solo capas del árbol |
| `layer_stats` | `servers/estadisticas.py::layer_stats` (WFS `resultType=hits` para el conteo; WPS `gs:Aggregate` para suma, promedio y agrupado) | Cifras de una capa: `{layer, filtros, conteo, campo?, suma?, promedio?, agrupado_por?, clases?, otras?}`. `field`/`group_by` se validan contra `DescribeFeatureType` |
| `create_map` | `servers/shares.py::create_map` (modo `query`→`_pick_best_layer`, o `layers`; luego `create_single_share`) | Mapa de un panel. Valida `year` contra la periodicidad. Devuelve `{id, kind, url, embed_html, layer?}` |
| `create_swipe` | `servers/shares.py::create_swipe` (una capa→`compare_years`, o dos capas→`_apply_year_filter` por panel + `create_swipe_share`) | Comparativo A\|B. Devuelve `{id, kind, url, embed_html}` |

**Nota sobre la numeralia (`describe_layer.numeralia`):** `mapalab.layer_stats.values` se persiste como **array plano** `[{posicion, nombre, valor, simbolo}]` (lo escribe `dataengine/jobs/run_refresh_layer_stats.py`). `describe_layer` lo lee por `layer_key = geoserver_workspace:geoserver_layer` vía `get_layer_stats` (`servers/layers.py`). La versión previa consultaba `values->'stats'` con columnas `geoserver_workspace`/`geoserver_layer` inexistentes en la tabla — devolvía vacío siempre (bug corregido en 1.82.0).

## Identificadores de capa (resolución exacta + difusa)

Todos los tools que reciben una capa usan el `id` del visor (el que devuelve `search_layers`). El workspace se resuelve solo desde el árbol; nunca hace falta pasarlo.

Los tools `describe_layer`, `query_wfs`, `create_map` (modo layers), `create_swipe` (ambos modos) aceptan **ids difusos**: slug, alias o nombre parcial (p. ej. `"homicidio"` resuelve a `homicidio_doloso`). La resolución (`resolve._resolve_layer_fuzzy`) intenta primero el id exacto; si no lo encuentra busca por slug/alias en la BD y por texto en `search_layers`.

## Parámetros acotados (Literal types)

Los parámetros con valores fijos usan `typing.Literal` para que Pydantic rechace valores inválidos de inmediato:

- **Basemaps**: `'voyager'`, `'position'`, `'sin_mapalab'` (NO existe `'osm'`). Aplica en `create_map` y `create_swipe`.
- **SRS de salida en `query_wfs`**: `'EPSG:4326'` (lat/lon) o `'EPSG:6368'` (CRS nativo, metros).
- **Source en `municipios`**: `'iieg'` o `'inegi'` (validado en `_normalize_municipios`).

Si el modelo manda un valor inválido (p. ej. `basemap="osm"`), Pydantic responde con un error claro: `Input should be 'voyager', 'position' or 'sin_mapalab'`.

## Auto-encuadre de la vista

`create_map` y `create_swipe` no requieren el parámetro `view`. Si se omite:

- Con `municipio` → calcula el bbox del municipio y encuadra automáticamente (zoom proporcional al tamaño).
- Sin `municipio` → vista por defecto de Jalisco: `{zoom: 7.5, lat: 20.6, lon: -103.4}`.

## Filtros estructurados en `query_wfs` (sin escribir CQL)

`query_wfs` ahora acepta parámetros opcionales que construyen el CQL del lado servidor:

- **`municipio`**: nombre o clave (ej. `"Guadalajara"`, `"14039"`). Resuelve con `municipios()`. Requiere que la capa tenga `searchMeta.hasMunicipio=true` configurado en el árbol; si no, devuelve error accionable. Usa `searchMeta.municipioField` y `searchMeta.municipioFieldType` (`clave` o `nombre`) para armar el filtro.
- **`year`**: 4 dígitos (ej. `"2024"`). Filtra `(fecha >= 'YYYY-01-01' AND fecha < 'YYYY+1-01-01')`.
- **`month`**: 1-12. Afina el filtro de fecha a un mes: `(fecha >= 'YYYY-MM-01' AND fecha < 'YYYY-MM+1-01')`.

Si pasás `cql_filter`, no combines con `municipio`/`year`/`month` (error explícito). El CQL sanitiza SQLi igual que antes.

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
) -> {id, kind, url, embed_html}
```

Crea un share `kind='swipe'` con separador arrastrable A\|B. Modo **una capa** (`layer`+`year_a`+`year_b`) para "antes vs después" de una misma capa; modo **dos capas** (`pane_a_layers`+`pane_b_layers`) para "compara robo vs homicidio", donde `year_a`/`year_b` opcionalmente filtran cada lado. En ambos modos el server arma y valida los filtros de fecha contra la periodicidad — el agente nunca escribe CQL.

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

**Regla única:** todo tool que recibe una capa usa el `id` que devuelve `search_layers` (p. ej. `homicidio_doloso`). El agente nunca necesita el `geoserver_workspace`/`geoserver_layer` ni armar `ws:layer` — el MCP lo resuelve solo desde el árbol (`resolve._resolve_layer_fuzzy`). Esto simplifica el flujo `search_layers → describe_layer/query_wfs → create_map/create_swipe` y es clave para agentes pequeños (p. ej. un Qwen 3B self-host).

`describe_layer` y `query_wfs` reciben solo `layer=<id>`; el workspace se deriva del árbol (con `workspace` opcional como override en `query_wfs`). `describe_layer.periodicidad` resume las fechas disponibles a `{años, meses}`.

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

Las respuestas vienen en formato SSE (`event: message\ndata: {...}`). Para parsearlas con `jq`, pipea con `sed 's/^data: //' | tail -1 | jq` o similar. Con auth activa agrega `-H 'Authorization: Bearer mk_...'`.

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

El flujo típico de un agente es `search_layers` / `describe_layer` para conocer la capa y luego `create_map` o `create_swipe` para entregar el mapa. Con auth activa agrega `-H 'Authorization: Bearer mk_...'` a los curl.

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

### Auditoría por key (uso del MCP en el historial de la llave)

Además de la telemetría agregada (anónima) de arriba, cada `tools/call` se registra **atribuido a la API key** en la misma tabla `mapalab_api_keys_accesos` que usa el widget embebido, para que el admin vea el uso del MCP en la pestaña **Auditoría** de cada llave (`/administrador/mapalab/api-keys`).

- `servers/telemetry.py` llama a `app.services.access_logger.get_logger().record(...)` en cada `tools/call` con `key_id is not None`:

  | Campo | Valor para MCP |
  |---|---|
  | `endpoint` | `mcp` (en la UI aparece como "Agente / MCP") |
  | `resultado` | `allowed` (HTTP<400), `denied` (error) o `quota_exceeded` (429 por cuota) |
  | `motivo` | nombre de la herramienta (`describe_layer`, `query_wfs`, …) |
  | `origin` | `null` (el MCP no tiene dominio) |
  | `ip_hash` | `X-Real-IP` hasheado, igual que el embed |

- El `access_flush_loop` arranca en el lifespan de `servers/mapalab.py` y flushea cada 30s a `POST /api/administrador/internal/mapalab/keys/accesos` (el **mismo** endpoint que el embed; el prefijo `/api/administrador` es obligatorio — un bug previo lo omitía y devolvía 404).
- Solo se registran los `tools/call`; `initialize`/`tools/list`/notificaciones quedan fuera (ruido de handshake). No se guardan los argumentos del tool.
- Frontend: `ApiKeyAuditoriaTab.jsx` mapea `endpoint=mcp` en la etiqueta y el filtro "Tipo de acción"; el botón de Auditoría está en la barra de acciones de cada llave (`ApiKeysTable.jsx`).

Así, para una key **privada de MCP** la pestaña Auditoría muestra qué herramientas se llamaron, cuándo y con qué resultado; para una key **pública de embed**, los accesos al mapa. Ambos canales conviven en el mismo historial, distinguidos por la columna "Acción".

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

## Auth y seguridad (v1.33.0+)

Hasta 1.32.x el MCP era **público sin auth**: cualquiera que alcanzara el endpoint podía llamar todas las tools, incluidas las writes (`create_*_share`) que persisten filas en la BD, sin rate limit ni atribución. Una auditoría de seguridad cerró tres frentes (H1 auth, H2 abuso de escritura, H3 flood). Desde **1.33.0** todo `/mcp` exige API key.

### H1 — Autenticación por API key

`MCPAuthMiddleware` (`servers/auth.py`, montado como middleware más externo sobre `combined_app`, antes que `MCPTelemetryMiddleware`) exige en **todas** las requests a `/mcp` un header:

```
Authorization: Bearer mk_pub_...        # (o mk_priv_..., o X-API-Key: mk_...)
```

La key se valida con `app.services.api_key_validator.validate_api_key(key, origin=None, ip=...)` — el mismo validador que ya usa el widget embebible, que consulta a mariachi (`/internal/mapalab/keys/validate`) y cachea el resultado (`EMBED_KEY_CACHE_TTL_SECONDS`, 300 s por defecto). La validación corre en un threadpool (`asyncio.to_thread`) para no bloquear el event loop.

- Sin key o key inválida → **401** con `WWW-Authenticate: Bearer realm="mapalab-mcp"` y un mensaje que explica cómo obtener una.
- El gate cubre lectura **y** escritura (decisión: cerrar también la fuga de nombres internos de workspaces/schemas vía `describe_layer`/`search_layers`).
- `/health`, `/` y `/metrics` quedan fuera del prefijo `/mcp`, así que el healthcheck del container sigue abierto.
- Toggle `MCP_AUTH_ENABLED` (default `true`). En `false` el middleware deja pasar todo — útil para dev local sin mariachi.

**Cómo conecta un cliente LLM** (la IA no hace login; el humano que opera el cliente pone la key en la config y el agente la reenvía en cada request):

```bash
claude mcp add --transport http \
  --header "Authorization: Bearer mk_pub_xxxxx" \
  mapalab https://iieg.jalisco.gob.mx/mapalab/mcp
```

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mapalab": {
      "url": "https://iieg.jalisco.gob.mx/mapalab/mcp",
      "transport": "http",
      "headers": { "Authorization": "Bearer mk_pub_xxxxx" }
    }
  }
}
```

> **Integración con mariachi (verificado).** El widget manda `origin` (dominio) y mariachi exige que la key pública tenga ese dominio en `dominios_permitidos`. El MCP **no tiene origin** (llama `validate_api_key(..., origin=None)`). En `mariachi/api/app/services/mapalab_keys.py::match_origin` el origin solo se valida para keys **públicas**: `match_origin(None, patterns)` devuelve `False` salvo que `patterns == ["*"]`. Las keys **privadas** (`mk_priv_`) no validan origin (solo `ips_permitidas`, y si está vacía no hay restricción). Por lo tanto, para el MCP emite desde el admin de mariachi (`/mapalab/api-keys`, rol `tetlamamakani`):
>
> - una key **privada** sin IPs (recomendado: el MCP no expone catálogo restringido por dominio), **o**
> - una key **pública con `dominios_permitidos=["*"]`** (nota: el alta de key pública rechaza con 400 si no se captura al menos un dominio, así que hay que poner explícitamente `*`).
>
> Una key pública con dominios concretos será rechazada con `origin_blocked` (401) al usarse desde el MCP.

### H2 — Cuota por key (abuso de escritura)

`MCPTelemetryMiddleware` (`servers/telemetry.py`) consume el `mapalab_key` que `MCPAuthMiddleware` dejó en el `scope` y, para cada `tools/call`, aplica `QuotaTracker` (`app.services.api_key_quota`):

- Antes de procesar: `can_consume(key_id, cuota_diaria, cuota_mensual)` — si la key agotó su cuota → **429** con `Retry-After: 60` (sin tocar la BD).
- Después: `record(key_id, error, bytes_out)` acumula uso en memoria.
- Un loop async (`quota_flush_loop`, `MCP_QUOTA_FLUSH_INTERVAL_SECONDS`, 60 s) flushea el buffer a mariachi (`/internal/mapalab/keys/usage`), mismo patrón que el widget. En shutdown se hace un flush síncrono final.

Las cuotas (`cuotaDiaria`/`cuotaMensual`) las define mariachi por key; `None` = sin límite.

### H3 — Rate limit + connection limit en nginx

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

Corta floods por IP antes de que lleguen al pool chico del MCP (2 workers × 2 conexiones). El burst de 20 absorbe el arranque normal de una sesión MCP (initialize + tools/list + varias tools/call).

### Piezas

| Archivo | Rol |
|---|---|
| `servers/auth.py` | `MCPAuthMiddleware` + `quota_flush_loop` + helper `send_json` |
| `servers/telemetry.py` | Enforcement + registro de cuota por key en `tools/call` |
| `servers/mapalab.py` | Wiring: auth como middleware externo, arranque/cierre del flush de cuota |
| `backend/app/config.py` | `MCP_AUTH_ENABLED`, `MCP_QUOTA_FLUSH_INTERVAL_SECONDS`, `MARIACHI_VERIFY_SSL` |
| `nginx/nginx-main.conf`, `nginx/nginx.conf` | Zonas y directivas `limit_req`/`limit_conn` |
| `app.services.api_key_validator`, `app.services.api_key_quota` | Reutilizados del path del widget (sin duplicar lógica) |

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
- **Timeout en queries PostGIS**: la reproyección WFS de `query_wfs` fija `SET LOCAL statement_timeout = 5000` y se hace en una sola query (no N+1). La numeralia de `describe_layer` es un `SELECT` plano sobre `mapalab.layer_stats` (sin PostGIS).
- **`filters.date` (CQL) sin validar server-side** (pendiente, M2): el share persiste el CQL verbatim y el visor lo reenvía a GeoServer en `CQL_FILTER`. Validar contra la forma esperada (`parseCQLToSelections`/`generateCQLFilter`) en `servers/shares.py`.
- **Cuota aproximada por multiproceso**: en producción el MCP corre con `gunicorn --workers ${MCP_WORKERS}` (default **2**). El `QuotaTracker` es en memoria **por proceso**, así que la cuota efectiva por key es ≈ `MCP_WORKERS × cuota` configurada. Para abuso, basta el `limit_req` de nginx + la cuota como tope blando; si se necesita un tope exacto hay que mover el contador a un store compartido (Redis) o que mariachi haga el pre-check autoritativo.
- **IP de `ips_permitidas` solo confiable en deploy directo**: el MCP toma el IP de `X-Real-IP` (lo fija el nginx inmediato, sobrescribiendo lo que mande el cliente; ya no se usa el primer `X-Forwarded-For` que era spoofeable). Detrás del gateway, `X-Real-IP` es la IP del gateway, no la del cliente final, así que el allowlist por IP de una key privada no discrimina por cliente en ese trayecto. Para keys de MCP, apóyate en el secreto de la key + cuota, no en `ips_permitidas`. Para habilitar allowlist por cliente detrás del gateway, mapalab-nginx debería propagar el `X-Real-IP` que ya calcula el gateway en vez de sobrescribirlo.
- **Sin observabilidad propia**: las llamadas a tools no aparecen en `/metrics` (excluido) ni se loggean separadas. Para monitorear, mirar logs de uvicorn/gunicorn filtrando por `/mcp/`.

## Pendiente — Publicar en el Claude Connectors Directory ("store")

> **Estado: no iniciado.** Hoy el MCP funciona como *conector personalizado* solo vía Claude Code/Desktop inyectando el header `Authorization: Bearer mk_...`. Para entrar al **Connectors Directory** de claude.ai (el listado oficial, "store") faltan los puntos de abajo. El bloqueo de fondo es la auth: el directorio exige **OAuth 2.1**, no API key estática.

### Por qué no entra hoy

| Camino | Auth aceptada | Estado mapalab |
|---|---|---|
| Conector personalizado (URL pegada por el usuario) | OAuth, o sin auth. La UI web de claude.ai **no** tiene campo para API key estática | Solo sirve vía Claude Code/Desktop con `--header` |
| **Connectors Directory** (listado oficial) | **OAuth 2.1 + PKCE obligatorio** | Falta todo lo de OAuth |

### Fase 1 — OAuth 2.1 (el 90 % del esfuerzo)

Reemplazar/duplicar el gate de API key (`servers/auth.py`) por un flujo OAuth 2.1. **No** implementar OAuth a mano: delegar en **Minerva** (proyecto SSO con Authentik + OIDC; ver `gateway-hub/docs/minerva.md`), que puede actuar como Authorization Server con DCR.

Requisitos del MCP como *Resource Server*:

- [ ] `GET /.well-known/oauth-protected-resource` en el `combined_app` — apunta al issuer de Minerva/Authentik.
- [ ] El Authorization Server (Minerva/Authentik) expone `/.well-known/oauth-authorization-server` y soporta **PKCE (S256)** y **Dynamic Client Registration** (o CIMD).
- [ ] Registrar el redirect URI de Claude: `https://claude.ai/api/mcp/auth_callback`.
- [ ] `MCPAuthMiddleware` valida el **access token OAuth** (JWT firmado por Authentik) en lugar de `mk_...`; mantener `MCP_AUTH_ENABLED` y un modo de compatibilidad para Claude Code (header) durante la transición.
- [ ] Mapear identidad OAuth → cuota. Decidir si la cuota sigue por "key" (ahora por `sub`/cliente OAuth) reutilizando `QuotaTracker`.
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
