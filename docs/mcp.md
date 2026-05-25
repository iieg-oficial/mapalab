# MCP server

Servidor [Model Context Protocol](https://modelcontextprotocol.io/) embebido en el backend de mapalab. Expone un subconjunto de los endpoints REST como tools para que clientes LLM (Claude Desktop, IDEs con soporte MCP, agentes) puedan consultar el catálogo de capas, su metadata, periodicidad y compartibles del visor.

## Por qué

- Los endpoints REST ya tienen contratos estables (Pydantic schemas, OpenAPI).
- `FastMCP.from_fastapi(...)` los re-expone como tools sin reescribir lógica.
- El backend ya corre 24/7 detrás de gateway-hub, no necesita una segunda pieza de infra.

## Qué se expone y qué no

| Router | MCP | Razón |
|---|---|---|
| `metadata` | sí | Lectura pura |
| `periodicity` | sí | Lectura pura |
| `layers` | sí | Lectura + cache invalidation |
| `shares` | sí | Lectura/escritura pequeña |
| `download` | **no** | Streams de CSV grandes (`COPY TO STDOUT`); inadecuado como tool MCP |
| `metrics` | **no** | Endpoint interno de Prometheus, no útil para un agente |

`/health` y `/ontoy` no se exponen tampoco porque viven en `app` directamente, no en un router.

## Arquitectura (v1.35.0+)

Desde 1.35.0 el MCP vive en un container dedicado `mapalab-mcp`, separado del backend principal. Sigue el patron estandar de los servers de [`iieg-oficial/agent`](https://github.com/iieg-oficial/agent/tree/main/servers).

```
mapalab-mcp container (servers/mapalab.py)
├── FastMCP("mapalab")
│   ├── @mcp.tool() search_layers, get_metadata, ...   (12 tools)
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

### Tools expuestos (12)

| Tool | Tipo | Razon |
|---|---|---|
| `search_layers` | Lectura | punto de entrada para resolver IDs por nombre |
| `resolve_layer_ref` | Lectura | slug/alias/id → capa |
| `get_layer_tree` | Lectura | arbol completo |
| `get_initial_order` | Lectura | capas activas al cargar |
| `get_workspaces` | Lectura | alias ↔ workspace real |
| `get_metadata` | Lectura | descripcion, fuentes, downloadable |
| `get_sources_batch` | Lectura | fuentes de varias capas |
| `get_periodicity` | Lectura | fechas de capa temporal |
| `get_periodicities_batch` | Lectura | periodicidad de varias capas |
| `measure_geometry` | Lectura | calcula longitud/area geodesica con PostGIS |
| `create_single_share` | **Write** | crea un share del visor (single) y devuelve `{id, url, embed_html}`. Idempotente (hash determinista del payload). |
| `create_swipe_share` | **Write** | crea un share en modo swipe (comparacion A\|B). Idempotente. |

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

## Tools generados

`from_fastapi` genera un tool por cada operación. Cada endpoint expuesto define `operation_id`, `summary` y `description` en su decorador, así que el tool MCP resultante hereda nombre corto, título legible y descripción larga sin extra mapping:

| Tool | Origen | Qué hace |
|---|---|---|
| `get_metadata` | GET `/metadata/` | Metadata completa de una capa |
| `get_sources_batch` | GET `/metadata/sources` | Fuentes de varias capas en lote |
| `get_database_stats` | GET `/metadata/database-stats` | Conteo total de registros del schema mapalab |
| `get_periodicity` | GET `/periodicity/` | Fechas disponibles de una capa temporal |
| `get_periodicities_batch` | GET `/periodicity/batch` | Periodicidad de varias capas |
| `get_layer_tree` | GET `/layers/tree` | Árbol jerárquico completo del visor |
| `get_initial_order` | GET `/layers/initial-order` | IDs activos al cargar el visor |
| `get_workspaces` | GET `/layers/workspaces` | Workspaces con alias + schema |
| `search_layers` | GET `/layers/search` | Búsqueda por label/tags/id — devuelve **label + path jerárquico** |
| `resolve_layer_ref` | GET `/layers/resolve` | Slug/alias → capa |
| `create_share` | POST `/shares` | Crea share del estado del mapa |
| `get_share` | GET `/shares/{share_id}` | Lee un share |
| `pin_share` | POST `/shares/{share_id}/pin` | Pin por 365 días |
| `unpin_share` | DELETE `/shares/{share_id}/pin` | Quita el pin |
| `pin_share_permanent` | POST `/shares/{share_id}/pin-permanent` | Pin permanente (token interno) |

Para cambiar el nombre o el texto que ve un cliente MCP, basta editar `operation_id`, `summary` o `description` en el decorador del endpoint correspondiente.

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

## Identificadores aceptados (v1.40.1+)

Tres tools comparten el mismo problema: el agente recibe un `id` de capa al llamar `search_layers` (p. ej. `tasa_homicidio_doloso`), pero originalmente `get_metadata`, `resolve_layer_ref` y `get_periodicity` esperaban valores distintos al `id` del visor. Esto rompía el flujo natural `search_layers → get_metadata` con respuestas vacías o 404.

Desde **1.40.1** los tres tools aceptan tanto el identificador del visor (`Layer.id`) como el del backend (`geoserver_layer` / slug / alias). Sin breaking change: si ya pasabas el valor original, sigue funcionando.

| Tool | Antes esperaba | Ahora también acepta |
|---|---|---|
| `get_metadata(workspace, layer)` | `workspace=<geoserver_workspace>`, `layer=<geoserver_layer>` (p. ej. `seguridad_y_proteccion_ciudadana`, `datos_delitos_homicidio_doloso_secretariado`) | `workspace=<alias>`, `layer=<Layer.id>` (p. ej. `seguridad`, `tasa_homicidio_doloso`) |
| `resolve_layer_ref(ref)` | `Layer.slug` o `LayerAlias.alias` | `Layer.id` como fallback final |
| `get_periodicity(workspace, layer)` | `{geoserver_workspace}:{geoserver_layer}` literal | resuelve alias → schema y `Layer.id` → `geoserver_layer` |

La resolución vive en helpers compartidos:

- `backend/app/services/layer_metadata_service.py::_resolve_layer_key` — workspace alias → `geoserver_workspace` y, si `(workspace_alias, id)` matchea una fila en `mapalab.layers`, usa su `geoserver_layer`.
- `backend/app/services/periodicity_service.py::_resolve_layer_key` — análogo pero contra `db_schema` (PostGIS) en lugar de `geoserver_workspace`.
- `backend/app/repositories/layers_repository.py::find_layer_by_slug_or_alias` — busca `Layer.slug`, luego `LayerAlias`, luego `Layer.id` como último intento.

`get_periodicities_batch` resuelve cada par `ws:layer` antes de consultar `layer_periodicity`, así un agente puede pasar `seguridad:tasa_homicidio_doloso` y recibir la respuesta sin saber el schema real (`seguridad_y_proteccion_ciudadana:datos_delitos_homicidio_doloso_secretariado`).

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

        result = await client.call_tool('get_workspaces', {})
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

Devuelve los 12 tools registrados con su `name`, `description` y `inputSchema`.

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
        "basemap": "osm",
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

Los tools individuales son útiles, pero el valor real para un agente está en encadenarlos. Tres recetas que cubren los casos típicos de un asistente conversacional pidiendo al MCP de mapalab que arme un mapa rico.

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
        "basemap": "osm",
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
        "basemap": "osm",
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
        "basemap": "osm",
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

## Auth y seguridad

- **Por ahora público.** Igual que el resto del backend de mapalab — el visor no requiere auth y los datos son catálogo público.
- Si se necesita restringir el MCP sin tocar REST, opciones:
  1. Allowlist de IPs en gateway-hub para `/mapalab/mcp/`.
  2. Header secret validado en gateway o en un middleware del backend.
  3. JWT con claims de `fastmcp` — la lib soporta autenticación nativa pero requiere reconfigurar el cliente.
- Rate limiting en gateway-hub aplica al path completo; si se vuelve un problema, definir una zona específica `mcp` en `gateway-hub/nginx/`.
- Los tools `refresh_cache_endpoint_*` e `invalidate_cache_endpoint_*` son writes baratos pero invocables por cualquiera. Mariachi los llama tras edits del árbol; si MCP los usa también, está OK porque solo regenera cache.

## Versiones

- `fastmcp ≥ 3.2.4` (requirement sin pin para acompañar updates)
- `mcp ≥ 1.27.0` (instalado transitivamente por fastmcp)
- Protocolo MCP: `2025-06-18`

`combine_lifespans` vive en `fastmcp.utilities.lifespan` desde fastmcp 2.x. Si en el futuro se actualiza fastmcp y desaparece el path, hay que migrar al patrón de `mcp_app.router.lifespan_context`.

## Cómo agregar un router al MCP

1. Importarlo en `backend/app/server.py`.
2. Agregarlo a `mcp_source_app.include_router(...)` antes de la línea `mcp = FastMCP.from_fastapi(...)`.
3. Si el router tiene endpoints que no quieres exponer, separarlos en un sub-router o filtrarlos con `tags` y excluir esos tags al instanciar el MCP.
4. Rebuild del backend (`docker compose build backend && docker compose up -d backend`).
5. Validar listando tools: `len(tools)` debería incrementarse.

## Cómo quitar un router del MCP

1. Removerlo del bloque `mcp_source_app.include_router(...)`.
2. **Mantenerlo** en `app.include_router(...)` para que siga vivo en REST.
3. Rebuild.

## Limitaciones conocidas

- **`download` queda fuera**: no es trivial exponer un stream de CSV como tool MCP. Si se requiere, considerar un endpoint alternativo que devuelva una URL firmada (S3/Acervo) en lugar del stream directo.
- **No hay rate limit específico para MCP**: el rate limit del gateway-hub aplica por path. Si un cliente abusivo abre muchas sesiones streamable, puede saturar workers de gunicorn antes que los límites del gateway.
- **Sin observabilidad propia**: las llamadas a tools no aparecen en `/metrics` (excluido) ni se loggean separadas. Para monitorear, mirar logs de uvicorn/gunicorn filtrando por `/mcp/`.

## Referencias

- [FastMCP docs — Integración con FastAPI](https://gofastmcp.com/integrations/fastapi)
- [FastMCP docs — Lifespan](https://gofastmcp.com/servers/lifespan)
- [Skill `fastapi-to-mcp`](../../docs/SKILL.md) — guía que se usó como base
- `backend/app/server.py` — implementación
- `nginx/nginx.conf` — bloques `location = /mcp[/]` y `location = /mapalab/mcp[/]`
