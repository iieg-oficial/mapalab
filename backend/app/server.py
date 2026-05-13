import asyncio
import os
import fcntl
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator, metrics as fastapi_metrics

from sqlalchemy import text
from fastmcp import FastMCP
from fastmcp.utilities.lifespan import combine_lifespans
from app import metrics as metrics_module
from app.routers import (metadata, periodicity, download, layers, shares, embed)
from app.exceptions.common_exceptions import BaseAppException
from app.services.access_logger import access_flush_loop, get_logger as get_access_logger, _flush_sync as _flush_accesos
from app.services.api_key_quota import flush_to_mariachi
from app.services.scheduler_service import SchedulerService
from app.services.periodicity_service import PeriodicityService
from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.config import settings
from app.utils.logger import Logger
from app.handlers.handle_exceptions import (
    app_exception_handler,
    general_exception_handler
)

_QUOTA_FLUSH_INTERVAL_SECONDS = 60

if settings.SENTRY_DSN:
    import sentry_sdk
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        send_default_pii=False,
    )

_lock_file = None

def _try_acquire_leader() -> bool:
    global _lock_file
    try:
        _lock_file = open("/tmp/mapalab_scheduler.lock", "w")
        fcntl.flock(_lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        return True
    except (OSError, IOError):
        if _lock_file:
            _lock_file.close()
            _lock_file = None
        return False


async def _quota_flush_loop() -> None:
    while True:
        try:
            await asyncio.sleep(_QUOTA_FLUSH_INTERVAL_SECONDS)
            sent = await asyncio.to_thread(flush_to_mariachi)
            if sent:
                Logger.info(f"embed.quota.flushed rows={sent}")
        except asyncio.CancelledError:
            break
        except Exception as exc:
            Logger.error(f"embed.quota.flush_loop_error {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        session.execute(text("SELECT 1"))
    Logger.info(f"Worker {os.getpid()} database pool warmed up")

    is_leader = _try_acquire_leader()
    if is_leader:
        Logger.info(f"Worker {os.getpid()} is leader, initializing schema and scheduler")
        PeriodicityService.ensure_schema()
        SchedulerService.start_scheduler()
    else:
        Logger.info(f"Worker {os.getpid()} is follower, skipping scheduler")

    flush_task = asyncio.create_task(_quota_flush_loop())
    access_task = asyncio.create_task(access_flush_loop())
    try:
        yield
    finally:
        flush_task.cancel()
        access_task.cancel()
        for task in (flush_task, access_task):
            try:
                await task
            except asyncio.CancelledError:
                pass
        try:
            await asyncio.to_thread(flush_to_mariachi)
        except Exception:
            pass
        try:
            await asyncio.to_thread(_flush_accesos, get_access_logger().drain())
        except Exception:
            pass
        if is_leader:
            SchedulerService.stop_scheduler()
            if _lock_file:
                _lock_file.close()


mcp_source_app = FastAPI(title="MapaLab MCP source")
mcp_source_app.include_router(metadata.router)
mcp_source_app.include_router(periodicity.router)
mcp_source_app.include_router(layers.router)
mcp_source_app.include_router(shares.router)

mcp = FastMCP.from_fastapi(app=mcp_source_app, name="MapaLab MCP")
mcp_app = mcp.http_app(path="/")

app = FastAPI(
    title = "MAPALB",
    lifespan=combine_lifespans(lifespan, mcp_app.lifespan),
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc"
)

app.add_middleware(
    middleware_class=CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator(
    excluded_handlers=["^/metrics$", "^/health$", "^/ontoy$", "^/$"],
    should_group_status_codes=True,
    should_ignore_untemplated=True,
).add(
    fastapi_metrics.requests()
).add(
    fastapi_metrics.latency(buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10))
).instrument(app)

app.add_exception_handler(BaseAppException, app_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

app.include_router(metadata.router)
app.include_router(periodicity.router)
app.include_router(download.router)
app.include_router(layers.router)
app.include_router(shares.router)
app.include_router(embed.router)
app.include_router(metrics_module.router)
app.mount("/mcp", mcp_app)
@app.get('/')
def root():
    return {'message':'MapaLab Backend API'}

@app.get('/health')
def health_check():
    return {'message':'ok'}


@app.get('/ontoy')
def ontoy():
    from app.__version__ import __version__
    return {'slug': 'mapalab-backend', 'label': 'MapaLab Backend', 'version': __version__}
