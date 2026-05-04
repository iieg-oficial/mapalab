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

## Arquitectura

`backend/app/server.py` construye **dos** apps FastAPI:

```
mcp_source_app  ── solo metadata + periodicity + layers + shares
       │
       └── FastMCP.from_fastapi(mcp_source_app)
              │
              └── mcp_app = mcp.http_app(path="/")
                       │
                       │ (mount)
                       ▼
app  ── todos los routers REST (incluye download y metrics)
       └── /mcp/  ←── mcp_app
```

El sub-app **no comparte instancia** con el `app` principal. Eso permite incluir `download` en REST y excluirlo de MCP de manera limpia, sin filtros ni reglas inversas.

### Lifespan compuesto

El `lifespan` original del backend hace tres cosas críticas:

1. Warmup del pool de SQLAlchemy (`SELECT 1`)
2. Leader election por flock para que solo un worker corra el scheduler
3. Start/stop del `SchedulerService` y `PeriodicityService.ensure_schema`

FastMCP necesita su propio lifespan para inicializar el `StreamableHTTP session manager`. Se componen con `combine_lifespans` de `fastmcp.utilities.lifespan`:

```python
app = FastAPI(
    lifespan=combine_lifespans(lifespan, mcp_app.lifespan),
    ...
)
```

Sin esto, el manager de sesiones de MCP no arranca (errores `Task group is not initialized`).

## Rutas

| Origen | URL |
|---|---|
| Interna (entre containers) | `http://backend:8000/mcp/` |
| Local desde host (puerto publicado) | `http://localhost:3006/api/mcp/` |
| Vía gateway-hub (staging/prod) | `https://<dominio>/mapalab/api/mcp/` |

Nota: el path final lleva slash. El cliente FastMCP lo agrega solo, pero `curl` necesita escribirlo (`/mcp/`, no `/mcp`).

## Configuración de nginx

`nginx/nginx.conf` agrega un `location /api/mcp/` separado del `/api/` general porque MCP usa **HTTP streamable transport** (SSE persistente):

```nginx
location /api/mcp/ {
    proxy_pass http://backend/mcp/;
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

El gateway-hub no necesita un `location` específico para `/mapalab/api/mcp/`: cae bajo el bloque general de `/mapalab/api/` que ya proxea al `mapalab-nginx`. Si en el futuro se observan problemas de buffering en el gateway, agregar un location análogo allá.

## Tools generados

`from_fastapi` genera un tool por cada operación. Los nombres siguen el patrón `<function_name>_<path>_<method>` (de `operation_id` autogenerado por FastAPI):

```
get_metadata_metadata
get_sources_batch_metadata_sources_get
get_periodicity_periodicity
get_periodicities_batch_periodicity_batch_get
get_layer_tree_layers_tree_get
get_initial_order_layers_initial_order_get
get_workspaces_layers_workspaces_get
search_layers_layers_search_get
resolve_layer_ref_layers_resolve_get
refresh_cache_endpoint_layers_refresh_cache_post
invalidate_cache_endpoint_layers_invalidate_cache_post
create_share_shares_post
get_share_shares
pin_share_shares
unpin_share_shares
pin_share_permanent_shares
```

Para nombres más cortos hay tres opciones:

1. Definir `operation_id="..."` en cada decorador (`@router.get("/tree", operation_id="get_layer_tree")`).
2. Pasar `mcp_names={"get_layer_tree_layers_tree_get": "layer_tree"}` a `FastMCP.from_fastapi`.
3. Definir tools manualmente con `@mcp.tool` para los más usados.

## Cómo probar

### Inspector oficial (lo más rápido)

```bash
npx @modelcontextprotocol/inspector
```

Browser en `http://localhost:6274` → Transport `Streamable HTTP` → URL `http://localhost:3006/api/mcp/` → Connect → tab Tools → List/Run.

### Cliente Python con FastMCP

```python
import asyncio, json
from fastmcp import Client

async def main():
    async with Client('http://localhost:3006/api/mcp/') as client:
        tools = await client.list_tools()
        print(f'{len(tools)} tools')
        for t in tools:
            print(' -', t.name)

        result = await client.call_tool('get_workspaces_layers_workspaces_get', {})
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
            'url': 'http://localhost:3006/api/mcp/',
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
      "url": "http://localhost:3006/api/mcp/",
      "transport": "http"
    }
  }
}
```

Reiniciar Claude Desktop. Los tools aparecen en el panel de herramientas del chat.

### curl (handshake)

```bash
curl -i -N -X POST http://localhost:3006/api/mcp/ \
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

Respuesta esperada: `200 OK` con `Content-Type: text/event-stream` y un evento `data:` con `serverInfo: {"name": "MapaLab MCP", ...}`.

## Auth y seguridad

- **Por ahora público.** Igual que el resto del backend de mapalab — el visor no requiere auth y los datos son catálogo público.
- Si se necesita restringir el MCP sin tocar REST, opciones:
  1. Allowlist de IPs en gateway-hub para `/mapalab/api/mcp/`.
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

- **Nombres largos**: heredados del `operation_id` autogenerado por FastAPI. Ver "Tools generados" para cómo acortarlos.
- **`download` queda fuera**: no es trivial exponer un stream de CSV como tool MCP. Si se requiere, considerar un endpoint alternativo que devuelva una URL firmada (S3/Acervo) en lugar del stream directo.
- **No hay rate limit específico para MCP**: el rate limit del gateway-hub aplica por path. Si un cliente abusivo abre muchas sesiones streamable, puede saturar workers de gunicorn antes que los límites del gateway.
- **Sin observabilidad propia**: las llamadas a tools no aparecen en `/metrics` (excluido) ni se loggean separadas. Para monitorear, mirar logs de uvicorn/gunicorn filtrando por `/mcp/`.

## Referencias

- [FastMCP docs — Integración con FastAPI](https://gofastmcp.com/integrations/fastapi)
- [FastMCP docs — Lifespan](https://gofastmcp.com/servers/lifespan)
- [Skill `fastapi-to-mcp`](../../docs/SKILL.md) — guía que se usó como base
- `backend/app/server.py` — implementación
- `nginx/nginx.conf` — bloque `location /api/mcp/`
