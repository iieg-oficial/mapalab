# MCP server

Servidor [Model Context Protocol](https://modelcontextprotocol.io/) dedicado (`mapalab-mcp`, separado del backend principal desde 1.35.0) que expone **13 tools** sobre el catálogo de capas, metadata, periodicidad, municipios de Jalisco, mediciones geodésicas y creación de shares del visor. Pensado para clientes LLM (Claude Desktop, IDEs con soporte MCP, agentes como IGIBot) que necesitan consultar o entregar mapas como respuesta.

## Por qué un container dedicado

- Los tools son manuales (`@mcp.tool()` en `servers/mapalab.py`), no auto-generados desde routers. Eso da control total sobre nombres, descripciones y qué se expone.
- Reutiliza los servicios y repositorios del backend (`app.services.*`, `app.repositories.*`) — el código de `backend/app` se copia al container del MCP en build time. Sin duplicación de lógica.
- Aislamiento: si un agente abusivo satura el MCP, no impacta al backend del visor que sirve al usuario final.
- Lifecycle propio: `mapalab-mcp` tiene su pool de SQLAlchemy chico (2 workers, 2 conexiones cada uno), separado del pool grande del backend.

## Qué se expone y qué no

13 tools (ver tabla completa más abajo en §Tools y su origen):

| Origen | MCP | Razón |
|---|---|---|
| Catálogo y metadata (`search_layers`, `get_layer_tree`, `get_initial_order`, `get_metadata`, `get_sources_batch`, `get_periodicity`) | **sí** (6 tools de lectura) | Lectura pura útil para agentes. `search_layers` también lista por tema; `get_layer_tree` incluye workspaces |
| Municipios (`municipios`) | **sí** (1 tool de lectura) | Lista los 125 o filtra por nombre/clave → claves INEGI para `create_*_share(municipios=...)` |
| Lógica nueva (`query_wfs`, `get_layer_stats`, `measure_geometry`, `create_single_share`, `create_swipe_share`, `compare_years`) | **sí** (3 lecturas + 3 writes) | Tools manuales que reutilizan `share_service`, PostGIS y GeoServer WFS para que un agente entregue mapas interactivos. `create_*_share` aceptan `municipios={source, selected}` para el modo Vista por municipio. |
| `download` (CSV streaming) | **no** | Streams de `COPY TO STDOUT`; el formato de respuesta MCP no encaja con streaming |
| `layers/{refresh-cache,invalidate-cache}` | **no** (removido en 1.48.1) | Requerían `X-Internal-Token` que el MCP no inyecta; siempre devolvían 401, eran ruido en `tools/list` |
| `shares/{pin,unpin,pin-permanent}` | **no** | Writes administrativos con efectos sobre la BD, no encajan en el patrón del MCP público |
| `metrics`, `health`, `ontoy` | **no** | Endpoints internos de operaciones, no útiles para un agente |

> **Superficie de lectura de `query_wfs` (decisión de exposición).** A diferencia del resto de tools (metadata/árbol curados), `query_wfs` deja que el agente corra CQL arbitrario y baje hasta 10 000 features completos de **cualquier capa publicada en el árbol del visor**. Esto es intencional: el visor de MapaLab es público y esos features ya se sirven vía WMS/WFS al frontend. **Pre-requisito de seguridad:** ninguna capa con datos sensibles/internos debe estar publicada en el árbol del visor (`mapalab.layer_tree_cache`), porque sería alcanzable por aquí. El tool solo resuelve capas presentes en el árbol (`find_node` sobre el tree cache), así que la frontera de exposición es exactamente "lo que el visor ya muestra al público".

## Arquitectura (v1.35.0+)

Desde 1.35.0 el MCP vive en un container dedicado `mapalab-mcp`, separado del backend principal. Sigue el patron estandar de los servers de [`iieg-oficial/agent`](https://github.com/iieg-oficial/agent/tree/main/servers).

```
mapalab-mcp container (servers/mapalab.py)
├── FastMCP("mapalab")
│   ├── @mcp.tool() search_layers, get_metadata, ...   (13 tools)
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

### Tools expuestos (13)

Convencion: **todos los tools que reciben una capa usan el `id` del visor** (el que devuelve `search_layers`). El workspace se resuelve solo desde el arbol; no hay que pasarlo.

| Tool | Tipo | Razon |
|---|---|---|
| `search_layers` | Lectura | punto de entrada: busca por texto/id/slug y/o por `theme`. Absorbe los antiguos `search_by_theme` y `resolve_layer_ref` |
| `get_layer_tree` | Lectura | arbol completo + `workspaces` en la misma respuesta |
| `get_initial_order` | Lectura | capas activas al cargar |
| `get_metadata` | Lectura | descripcion, fuentes, downloadable (solo `id`) |
| `get_sources_batch` | Lectura | fuentes de varias capas (ids separados por coma) |
| `get_periodicity` | Lectura | fechas de 1 o N capas temporales. Absorbe el antiguo `get_periodicities_batch` |
| `measure_geometry` | Lectura | longitud/area geodesica con PostGIS (cap 2000 coords) |
| `query_wfs` | Lectura | features WFS de una capa con CQL opcional |
| `municipios` | Lectura | lista los 125 o busca por nombre/clave. Absorbe `list_municipios` + `resolve_municipios` |
| `create_single_share` | **Write** | crea un share single y devuelve `{id, url, embed_html}`. Idempotente |
| `create_swipe_share` | **Write** | crea un share swipe (comparacion A\|B). Idempotente |
| `compare_years` | **Write** | atajo swipe A\|B de una capa entre dos años + municipio opcional. Idempotente |
| `get_layer_stats` | Lectura | numeralia precalculada de una capa |

**Consolidacion de tools:** de 18 → 13 tools. `search_by_theme` y `resolve_layer_ref` se fusionaron en `search_layers` (params `theme`/`query`); `get_periodicities_batch` en `get_periodicity` (acepta 1 o N); `list_municipios` + `resolve_municipios` en `municipios(query?)`; `get_workspaces` se eliminó y ahora va dentro de `get_layer_tree`. Identificadores homologados al `id` del visor.

Los tools de invalidacion de cache (`refresh_layer_tree_cache`, `invalidate_layer_tree_memory_cache`) **quedan fuera del MCP desde 1.45.2**: los endpoints REST equivalentes requieren `X-Internal-Token` que el MCP no inyecta, asi que en la practica siempre devolvian 401 — eran ruido en `tools/list`. Mariachi sigue invocando los REST directos desde `iieg-network`. Los `shares` de fan-out admin (`pin_share_permanent`, etc.) tambien quedan fuera. Los `create_*_share` y `measure_geometry` (v1.44.0) son writes intencionales, disenados para que un agente conversacional como [IGIBot](https://igibot.jalisco.gob.mx) entregue mapas interactivos como resultado de su razonamiento.

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
| Via gateway-hub (staging/prod) | `https://<dominio>/mapalab/mcp` |

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

Los 13 tools son manuales (`@mcp.tool()` en `servers/mapalab.py`). Wrappers delgados sobre lógica del backend; los de share/medición/municipios reutilizan helpers de `servers/share_tools.py`. Para cambiar el nombre o el texto que ve un cliente MCP, basta editar la firma del decorador o el docstring de la función.

| Tool | Origen del código | Qué hace |
|---|---|---|
| `search_layers` | `LayersRepository.search_layers` + `find_layer_by_slug_or_alias` + `search_by_theme` sobre el árbol | Busca por texto/id/slug (`query`) y/o lista un tema (`theme`). Devuelve `{id, label, slug, workspace, path}` |
| `get_layer_tree` | `app.services.layer_tree_service.get_cached_state` | Árbol jerárquico completo **+ `workspaces`** en la misma respuesta |
| `get_initial_order` | `get_cached_state['initial_order']` | IDs activos al cargar el visor |
| `get_metadata` | `layer_metadata_service.get_metadata_response` (workspace resuelto desde el árbol por `id`) | Metadata completa de una capa |
| `get_sources_batch` | `layer_metadata_service.get_sources_batch` (ids → `alias:id` vía `_to_layer_keys`) | Fuentes de varias capas en lote |
| `get_periodicity` | `PeriodicityService.get_periodicities_batch` (1 o N ids, re-keyed al `id`) | Fechas year/month/day de capas temporales |
| `measure_geometry` | `servers/share_tools.py::measure_geometry` (PostGIS `ST_Length`/`ST_Area::geography`) | Longitud o área geodésica de GeoJSON (cap 2000 coords + `statement_timeout`) |
| `query_wfs` | `servers/share_tools.py::query_wfs` (GeoServer WFS GetFeature) | Features de una capa con CQL opcional. Workspace resuelto por `id`. Sanitiza SQLi, solo capas del árbol |
| `municipios` | `MunicipiosRepository.list_all` (todos) o substring (con `query`) | Lista los 125 municipios o filtra por nombre/clave. Devuelve `{items, count}` |
| `create_single_share` | `servers/share_tools.py::create_single_share` (reutiliza `share_service.validate_payload` + `ShareRepository.upsert`) | Crea share `kind=single` y devuelve `{id, url, embed_html}`. Acepta `annotations` y `municipios={source, selected}` |
| `create_swipe_share` | `servers/share_tools.py::create_swipe_share` | Crea share `kind=swipe` para comparación A\|B. `municipios` aplica a ambos paneles |
| `compare_years` | `servers/share_tools.py::compare_years` | Atajo swipe comparativo de dos años con filtro de municipio opcional |
| `get_layer_stats` | `servers/share_tools.py::get_layer_stats` | Numeralia de `mapalab.layer_stats` (totales, ranking); vacía si no hay datos |

### Modo Vista por municipio en shares

`create_single_share` y `create_swipe_share` aceptan `municipios={source: "iieg"|"inegi", selected: ["14039", "14120", ...]}` desde 1.48.x. El validador del share (`share_service._validate_municipios`) limita a 125 claves (los municipios totales de Jalisco). Cuando se abre el share, el visor activa el modo: máscara visual oscura fuera de los polígonos seleccionados, filtro CQL `{municipioField} IN (...)` automático en capas activas que soporten el filtro. Ver `docs/municipio-mode.md` para el flujo completo.

Patrón típico desde un agente:

```
1. municipios(query="guadalajara") → [{clave:"14039",nombre:"Guadalajara"}, {clave:"14120",nombre:"Zapopan"}]
2. create_single_share(
       layers=["tasa_homicidio_doloso"],
       view={zoom:11, lat:20.66, lon:-103.35},
       municipios={"source":"iieg", "selected":["14039","14120"]},
   )
3. → embed_html con el visor filtrado a esos 2 municipios
```

## Entrega de mapas a agentes conversacionales (v1.44.0+)

Tres tools disenados para que agentes LLM (p. ej. IGIBot) entreguen mapas interactivos en respuesta a preguntas del usuario, no solo descripciones de texto:

### `create_single_share`

```
create_single_share(
    layers: list,                    # IDs del visor o {slug, opacity?, ...}
    view: dict | None = None,        # {zoom, lat, lon}
    basemap: str | None = None,
    selected: str | None = None,
    annotations: list | None = None, # GeoJSON EPSG:4326
) -> {id, kind, url, embed_html}
```

Crea un share `kind='single'` y devuelve:

- `id`: hash corto de 10 chars (`qd6fj67ex3`)
- `url`: enlace directo al visor (`https://iieg.gob.mx/mapalab/mapa?s=...`)
- `embed_html`: snippet `<script>...</script><iieg-mapalab share="...">` listo para pegar en cualquier sitio web que cargue el widget

El bot pega el `embed_html` en su respuesta markdown; el frontend del bot lo renderiza con `react-markdown` o equivalente y el navegador del usuario monta el widget. La key publica `mk_pub_...` la sustituye el bot con la que IIEG le haya asignado.

`annotations` permite pre-pintar lineas/poligonos/textos/emojis sobre el mapa — util para resaltar el resultado de un analisis (bbox de municipios, area de interes, marcadores). Mismo schema que `payload.annotations` de los shares (ver `docs/swipe.md §Annotations`).

### `create_swipe_share`

```
create_swipe_share(
    pane_a_layers, pane_b_layers,
    position: float = 0.5,           # 0.05 .. 0.95
    view, basemap, label_a, label_b,
    annotations: list | None = None,
) -> {id, kind, url, embed_html}
```

Crea un share `kind='swipe'` con dos sets de capas para comparacion A\|B. Igual que `create_single_share` pero el visor abre con el separador arrastrable. Ideal para "compara homicidios vs poblacion" o "antes vs despues" cuando el bot detecta una pregunta comparativa.

### `measure_geometry`

```
measure_geometry(geometry: dict) -> {type, metric, value, unit, value_km|value_km2}
```

Recibe geometria GeoJSON EPSG:4326 y devuelve longitud (LineString) o area (Polygon/MultiPolygon) geodesica. Bajo el cap usa PostGIS `ST_Length`/`ST_Area` sobre `::geography`, asi los metros/metros cuadrados son reales sobre el elipsoide WGS84 (no proyectados, no aproximados).

Util para que el bot responda preguntas tipo "cuanta superficie tiene el municipio X" o "que distancia hay entre A y B" sin tener que hacer el calculo por sí mismo.

### Patron de uso desde un agente

```
1. usuario: "muestrame los homicidios en Guadalajara"
2. agente: search_layers(q="homicidio")        -> id "tasa_homicidio_doloso"
3. agente: get_metadata(workspace="seguridad", layer="tasa_homicidio_doloso")
4. agente: create_single_share(
       layers=["tasa_homicidio_doloso"],
       view={"zoom":11, "lat":20.677, "lon":-103.349},
   )
5. agente: responde con texto + embed_html del share
```

El usuario ve un mapa interactivo embebido donde puede activar la barra de mediciones del visor (mapalab 1.43.0+) y guardar su propia copia como share desde el boton "Compartir".

## Identificadores: solo el `id` del visor

**Regla única:** todo tool que recibe una capa usa el `id` que devuelve `search_layers` (p. ej. `homicidio_doloso`). El agente nunca necesita el `geoserver_workspace`/`geoserver_layer` ni armar `ws:layer` — el MCP lo resuelve solo desde el árbol. Esto simplifica el flujo `search_layers → get_metadata/get_periodicity/query_wfs/get_layer_stats` y es clave para agentes pequeños (p. ej. un Qwen 3B self-host).

Cómo se resuelve internamente:

- `servers/mapalab.py::_resolve_layer(id)` — del árbol (`get_cached_state`) obtiene `workspace` (alias), `geoserver_workspace` y `geoserver_layer` de una capa por su `id`.
- `servers/mapalab.py::_to_layer_keys(ids)` — convierte `"id1,id2"` a `["alias:id1", "alias:id2"]` para los servicios batch (`get_sources_batch`, `get_periodicity`). Un token que ya trae `:` se respeta.
- `get_metadata` y `query_wfs` reciben solo `layer=<id>` (con `workspace` opcional como override); el workspace se deriva del árbol.
- `get_periodicity` acepta uno o varios ids separados por coma y re-keya la respuesta al `id` (no a `alias:id`).

**Compatibilidad:** los tools que antes pedían `workspace` mantienen el parámetro como override opcional, pero pasar solo el `id` es el camino recomendado y documentado.

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

        result = await client.call_tool('get_layer_tree', {})
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

Devuelve los 13 tools registrados con su `name`, `description` y `inputSchema`.

### curl (`tools/call`) — pruebas rápidas de los tools nuevos

Las respuestas vienen en formato SSE (`event: message\ndata: {...}`). Para parsearlas con `jq`, pipea con `sed 's/^data: //' | tail -1 | jq` o similar.

**`measure_geometry`** — distancia geodésica entre dos puntos:

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 1,
    "method": "tools/call",
    "params": {
      "name": "measure_geometry",
      "arguments": {
        "geometry": {
          "type": "LineString",
          "coordinates": [[-103.349, 20.677], [-103.413, 20.721]]
        }
      }
    }
  }'
```

Respuesta esperada (~8.26 km entre Guadalajara y Zapopan):

```json
{"type":"LineString","metric":"length","value":8257.36,"unit":"m","value_km":8.2574}
```

**`measure_geometry`** — área de un polígono:

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 2,
    "method": "tools/call",
    "params": {
      "name": "measure_geometry",
      "arguments": {
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-103.4,20.6],[-103.3,20.6],[-103.3,20.7],[-103.4,20.7],[-103.4,20.6]
          ]]
        }
      }
    }
  }'
```

**`create_single_share`** — crea un share con capa + anotación:

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 3,
    "method": "tools/call",
    "params": {
      "name": "create_single_share",
      "arguments": {
        "layers": ["tasa_homicidio_doloso"],
        "view": {"zoom": 9, "lat": 20.6, "lon": -103.4},
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

Devuelve `{id, kind, url, embed_html}`. Pegar `url` en un navegador abre el visor con todo configurado; pegar `embed_html` en una página renderiza el mapa embebido.

**`create_swipe_share`** — comparación A|B:

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 4,
    "method": "tools/call",
    "params": {
      "name": "create_swipe_share",
      "arguments": {
        "pane_a_layers": ["tasa_homicidio_doloso"],
        "pane_b_layers": ["poblacion"],
        "position": 0.5,
        "view": {"zoom": 8, "lat": 20.6, "lon": -103.4},
        "label_a": "Homicidio",
        "label_b": "Población"
      }
    }
  }'
```

### Playground del admin Mariachi

`/administrador/documentacion` tab "Servidor MCP" expone un playground con botón "Probar" por tool — incluye los 3 nuevos (`create_single_share`, `create_swipe_share`, `measure_geometry`) llamados via `tools/call` JSON-RPC al endpoint `/mcp/`. Los demás tools del MCP (read-only) se prueban contra sus REST equivalentes.

Respuesta esperada: `200 OK` con `Content-Type: text/event-stream` y un evento `data:` con `serverInfo: {"name": "MapaLab MCP", ...}`.

## Recetas — combinaciones reales de tools

Los tools individuales son útiles, pero el valor real para un agente está en encadenarlos. Estas recetas cubren los casos típicos de un asistente conversacional pidiendo al MCP de mapalab que arme un mapa rico.

### Guía rápida

- **Basemaps válidos**: `"voyager"` (recomendado) o `"position"`. No uses `"osm"` — no existe en el catálogo.
- **Filtros de fecha**: usa `get_periodicity` para saber qué años hay. El CQL para año `AAAA` es: `"(fecha >= 'AAAA-01-01' AND fecha < 'AAAA+1-01-01')"`. Se pasa como `filters: {"date": "..."}` en el objeto de capa.
- **Anotaciones**: tipos `LineString`, `Polygon`, `Emoji`, `Text`. Para emoji usa `type: "Emoji"` con `textLabel: "📍"`. Las anotaciones en swipe son globales (ambos lados).
- **Municipios**: `municipios(query="Guadalajara")` → clave INEGI. Pasa `municipios: {source: "iieg", selected: ["14039"]}`.
- **Estructura de capa en share**: acepta string (ID) o objeto `{slug, visible?, opacity?, filters?}`.
- **Medición previa**: usa `measure_geometry` antes de crear el share para reportar área/longitud en texto.

### Receta 0 — Capa con fecha, centrada en un municipio, con anotaciones

**Escenario:** el usuario pide "homicidios 2025 en Guadalajara marcando el perímetro".

```
1. search_layers(q="homicidio") → id "homicidio_doloso"
2. get_periodicity(workspace="seguridad", layer="homicidio_doloso") → años 2017-2026
3. municipios(query="Guadalajara") → clave "14039"
4. measure_geometry(poligono aproximado de GDL) → "239 km²"
5. create_single_share(
     layers=[{slug:"homicidio_doloso", filters:{date:"(fecha >= '2025-01-01' AND fecha < '2026-01-01')"}}],
     view={zoom:12, lat:20.677, lon:-103.35},
     basemap="voyager",
     municipios={source:"iieg", selected:["14039"]},
     annotations=[
       {id:"gdl", type:"Polygon", geometry:{...}, label:"Guadalajara", value:239.92, unit:"km²"},
       {id:"lmateos", type:"LineString", geometry:{...}, label:"Av. Lopez Mateos"},
       {id:"pin", type:"Emoji", geometry:{type:"Point",coordinates:[-103.347,20.677]}, textLabel:"📍"}
     ]
   )
6. → {url, embed_html}
```

### Receta 1 — Medir un polígono y crear un share con la zona resaltada

**Escenario:** el usuario dice "muéstrame el área norte de Guadalajara con la tasa de homicidio". El agente arma un polígono que aproxima la zona, lo mide para reportar el área, y crea un share con la capa de homicidio + el polígono pre-pintado.

**Paso 1 — calcular el área del polígono:**

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 1,
    "method": "tools/call",
    "params": {
      "name": "measure_geometry",
      "arguments": {
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-103.39, 20.70], [-103.32, 20.70],
            [-103.32, 20.75], [-103.39, 20.75],
            [-103.39, 20.70]
          ]]
        }
      }
    }
  }'
```

Devuelve `{"type":"Polygon","metric":"area","value":~30000000,"unit":"m²","value_km2":~30}`. El agente puede responder al usuario "El área norte que describes mide ~30 km²".

**Paso 2 — crear el share reusando el mismo polígono como `annotation`:**

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 2,
    "method": "tools/call",
    "params": {
      "name": "create_single_share",
      "arguments": {
        "layers": ["tasa_homicidio_doloso"],
        "view": {"zoom": 12, "lat": 20.725, "lon": -103.355},
        "basemap": "voyager",
        "annotations": [
          {
            "id": "area-norte",
            "type": "Polygon",
            "geometry": {
              "type": "Polygon",
              "coordinates": [[
                [-103.39, 20.70], [-103.32, 20.70],
                [-103.32, 20.75], [-103.39, 20.75],
                [-103.39, 20.70]
              ]]
            },
            "label": "Área norte (~30 km²)",
            "value": 30000000,
            "unit": "m²"
          },
          {
            "id": "label-norte",
            "type": "Text",
            "geometry": {"type": "Point", "coordinates": [-103.355, 20.725]},
            "textLabel": "Zona analizada",
            "rotation": 0
          }
        ]
      }
    }
  }'
```

Devuelve `{id, url, embed_html}`. El bot pega el `embed_html` en su respuesta markdown y el usuario ve el mapa con la capa de homicidio activa, el polígono resaltando el área norte, y la etiqueta "Zona analizada" en el centro.

### Receta 2 — Comparación A|B con swipe

**Escenario:** el usuario pregunta "compárame las zonas con más homicidios versus la densidad poblacional". El agente arma un swipe que muestra una capa de cada lado.

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_swipe_share",
      "arguments": {
        "pane_a_layers": ["tasa_homicidio_doloso"],
        "pane_b_layers": ["poblacion"],
        "position": 0.5,
        "view": {"zoom": 9, "lat": 20.6, "lon": -103.4},
        "basemap": "voyager",
        "label_a": "Tasa de homicidio doloso",
        "label_b": "Población"
      }
    }
  }'
```

El visor abre con la barra divisora arrastrable al centro: A muestra homicidio, B muestra población. El usuario puede arrastrar la barra para "frotar" visualmente las dos capas en la misma región. Los `label_a`/`label_b` aparecen en la píldora inferior del visor (`<SlotBadge>`).

### Receta 3 — Swipe con polígono compartido entre ambos lados

**Escenario:** el agente quiere comparar dos capas pero además resaltar el municipio sobre el que está la pregunta. Las anotaciones son globales del mapa (no por pane), así que el polígono se pinta sobre los dos lados del swipe.

```bash
curl -s -X POST http://localhost:3006/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_swipe_share",
      "arguments": {
        "pane_a_layers": ["tasa_homicidio_doloso"],
        "pane_b_layers": ["poblacion"],
        "position": 0.5,
        "view": {"zoom": 11, "lat": 20.66, "lon": -103.35},
        "basemap": "voyager",
        "label_a": "Homicidio",
        "label_b": "Población",
        "annotations": [
          {
            "id": "guadalajara-bbox",
            "type": "Polygon",
            "geometry": {
              "type": "Polygon",
              "coordinates": [[
                [-103.42, 20.62], [-103.28, 20.62],
                [-103.28, 20.74], [-103.42, 20.74],
                [-103.42, 20.62]
              ]]
            },
            "label": "Guadalajara"
          },
          {
            "id": "centro-gdl",
            "type": "Emoji",
            "geometry": {"type": "Point", "coordinates": [-103.349, 20.677]},
            "textLabel": "📍",
            "rotation": 0
          }
        ]
      }
    }
  }'
```

El visor abre con swipe activo + el bbox de Guadalajara y un pin emoji en el centro pintados sobre **ambos** paneles. Al arrastrar la barra, el polígono y el emoji siempre son visibles — son del nivel del mapa, no de un pane. Esto está intencionalmente alineado con la decisión documentada en `docs/swipe.md §Pendientes`: las mediciones son geográficas, no del slot.

### Patrón general: medición → annotation

Cuando un análisis del agente produce una geometría (polígono de un municipio, línea entre dos puntos, área de cobertura), el patrón natural es:

1. `measure_geometry(geometry)` → obtienes `{value, unit, value_km|value_km2}` para reportar al usuario en texto.
2. `create_single_share` o `create_swipe_share` con la **misma** `geometry` dentro de `annotations[]` y `value`/`unit` del paso 1 en el objeto annotation para preservar el contexto del análisis.

El usuario ve la métrica en texto y el mapa interactivo donde puede explorar la zona.

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
- El gate cubre lectura **y** escritura (decisión: cerrar también la fuga de nombres internos de workspaces/schemas vía `get_layer_tree`).
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
3. Para tools de share, ya existe `servers/share_tools.py` con helpers compartidos (`_persist_share`, `_normalize_layer_entries`, etc.) — extender ahí si aplica.
4. Rebuild del container MCP: `docker compose build mapalab-mcp && docker compose up -d mapalab-mcp`.
5. Validar: `curl -s -X POST $URL -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | jq '.result.tools | length'` debería incrementarse.

## Cómo quitar un tool

1. Removerlo de `servers/mapalab.py` (el `@mcp.tool()` completo).
2. Si la función auxiliar no se usa en otro lado, limpiarla también.
3. Si era un wrapper de un endpoint REST, **mantener** el endpoint REST original — el visor o mariachi lo siguen usando. Solo cambia la exposición al MCP.
4. Rebuild + verificar count en `tools/list`.

## Limitaciones conocidas

- **`download` queda fuera**: no es trivial exponer un stream de CSV como tool MCP. Si se requiere, considerar un endpoint alternativo que devuelva una URL firmada (S3/Acervo) en lugar del stream directo.
- **M1 resuelto (cap de vértices + timeout)**: `measure_geometry` topa la geometría a `MAX_COORDINATES_PER_GEOMETRY` (reutiliza `share_service._count_coordinates`) y todas las queries PostGIS del MCP (`measure_geometry`, reproyección WFS, `get_layer_stats`) fijan `SET LOCAL statement_timeout = 5000`. La reproyección de `query_wfs` se hace en una sola query (no N+1).
- **`filters.date` (CQL) sin validar server-side** (pendiente, M2): el share persiste el CQL verbatim y el visor lo reenvía a GeoServer en `CQL_FILTER`. Validar contra la forma esperada (`parseCQLToSelections`/`generateCQLFilter`) en `servers/share_tools.py`.
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

### Fase 2 — Anotaciones de los 13 tools

El directorio exige que cada tool declare metadata (hoy `servers/mapalab.py` solo tiene docstrings):

- [ ] `title` legible por tool.
- [ ] `readOnlyHint=True` en los 10 de lectura.
- [ ] `readOnlyHint=False` (o `destructiveHint`) en los 3 writes (`create_single_share`, `create_swipe_share`, `compare_years`).
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
- [Skill `fastapi-to-mcp`](../../docs/SKILL.md) — guía que se usó como base
- `backend/app/server.py` — implementación
- `nginx/nginx.conf` — bloques `location = /mcp[/]` y `location = /mapalab/mcp[/]`
