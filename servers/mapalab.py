from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastmcp.utilities.lifespan import combine_lifespans
from sqlalchemy import text

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.services.access_logger import (
    access_flush_loop,
    get_logger as get_access_logger,
    _flush_sync as _flush_accesos,
)
from app.utils.logger import Logger

import servers.herramientas_lectura
import servers.herramientas_mapas
from servers.borde import BordeMiddleware
from servers.servidor import mcp
from servers.telemetry import (
    MCPTelemetryMiddleware,
    flush_loop as telemetry_flush_loop,
    flush_pending_sync as telemetry_flush_pending_sync,
)

HERRAMIENTAS = (servers.herramientas_lectura, servers.herramientas_mapas)


@asynccontextmanager
async def lifespan(server_app: FastAPI) -> AsyncIterator[None]:
    try:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            session.execute(text('SELECT 1'))
        Logger.info('mapalab-mcp database pool warmed up')
    except Exception as exc:
        Logger.warning(f'mapalab-mcp warmup_error {type(exc).__name__}')

    tareas = (asyncio.create_task(telemetry_flush_loop()), asyncio.create_task(access_flush_loop()))
    try:
        yield
    finally:
        for tarea in tareas:
            tarea.cancel()
        await asyncio.gather(*tareas, return_exceptions=True)
        for vaciar in (telemetry_flush_pending_sync, lambda: _flush_accesos(get_access_logger().drain())):
            try:
                await asyncio.to_thread(vaciar)
            except Exception as exc:
                Logger.warning(f'mapalab-mcp shutdown_flush_error {type(exc).__name__}')


_admin_app = FastAPI(title='MapaLab MCP Server')


@_admin_app.get('/')
def root() -> dict[str, str]:
    return {'service': 'MapaLab MCP Server', 'mcp': '/mcp'}


@_admin_app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


mcp_app = mcp.http_app(path='/mcp', stateless_http=True)

app = FastAPI(
    title='MapaLab MCP Server',
    routes=[*_admin_app.routes, *mcp_app.routes],
    lifespan=combine_lifespans(lifespan, mcp_app.lifespan),
)
app.add_middleware(MCPTelemetryMiddleware, path_prefix='/mcp')
app.add_middleware(BordeMiddleware, path_prefix='/mcp')
