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
| `refresh_layer_tree_cache` | POST `/layers/refresh-cache` | Regenera cache materializada (token interno) |
| `invalidate_layer_tree_memory_cache` | POST `/layers/invalidate-cache` | Invalida cache en memoria (token interno) |
| `create_share` | POST `/shares` | Crea share del estado del mapa |
| `get_share` | GET `/shares/{share_id}` | Lee un share |
| `pin_share` | POST `/shares/{share_id}/pin` | Pin por 365 días |
| `unpin_share` | DELETE `/shares/{share_id}/pin` | Quita el pin |
| `pin_share_permanent` | POST `/shares/{share_id}/pin-permanent` | Pin permanente (token interno) |

Para cambiar el nombre o el texto que ve un cliente MCP, basta editar `operation_id`, `summary` o `description` en el decorador del endpoint correspondiente.

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

- **`download` queda fuera**: no es trivial exponer un stream de CSV como tool MCP. Si se requiere, considerar un endpoint alternativo que devuelva una URL firmada (S3/Acervo) en lugar del stream directo.
- **No hay rate limit específico para MCP**: el rate limit del gateway-hub aplica por path. Si un cliente abusivo abre muchas sesiones streamable, puede saturar workers de gunicorn antes que los límites del gateway.
- **Sin observabilidad propia**: las llamadas a tools no aparecen en `/metrics` (excluido) ni se loggean separadas. Para monitorear, mirar logs de uvicorn/gunicorn filtrando por `/mcp/`.

## Referencias

- [FastMCP docs — Integración con FastAPI](https://gofastmcp.com/integrations/fastapi)
- [FastMCP docs — Lifespan](https://gofastmcp.com/servers/lifespan)
- [Skill `fastapi-to-mcp`](../../docs/SKILL.md) — guía que se usó como base
- `backend/app/server.py` — implementación
- `nginx/nginx.conf` — bloque `location /api/mcp/`
