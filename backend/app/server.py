import asyncio
import os
import fcntl
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from sqlalchemy import text
from app.routers import (metadata, periodicity, download, layers, shares, embed, embed_marco, embed_telemetria, municipios, client_errors, catalogo, sesion, privado)
from app.exceptions.common_exceptions import BaseAppException
from app.services.access_logger import access_flush_loop, get_logger as get_access_logger, _flush_sync as _flush_accesos
from app.services.api_key_quota import flush_to_mariachi
from app.services.embed_telemetria import flush_to_mariachi as flush_telemetria
from app.services.client_error_tracker import snapshot as client_error_snapshot
from app.services.embed_abuse_tracker import snapshot as embed_abuse_snapshot
from app.services.scheduler_service import SchedulerService
from app.services.periodicity_service import PeriodicityService
from app.consts.databases import DatabaseType
from app.databases.async_pool import close_pool as close_async_pool
from app.databases.factory import DatabaseFactory
from app.config import settings
from app.utils.logger import Logger
from app.handlers.handle_exceptions import (
    app_exception_handler,
    general_exception_handler
)

_QUOTA_FLUSH_INTERVAL_SECONDS = 60

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
            telemetria = await asyncio.to_thread(flush_telemetria)
            if telemetria:
                Logger.info(f"embed.telemetria.flushed rows={telemetria}")
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
            await asyncio.to_thread(flush_telemetria)
        except Exception:
            pass
        try:
            await asyncio.to_thread(_flush_accesos, get_access_logger().drain())
        except Exception:
            pass
        try:
            await close_async_pool()
        except Exception:
            pass
        if is_leader:
            SchedulerService.stop_scheduler()
            if _lock_file:
                _lock_file.close()


app = FastAPI(
    title = "MAPALB",
    lifespan=lifespan,
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
    openapi_url=None if settings.ENVIRONMENT == "production" else "/openapi.json"
)

app.add_middleware(
    middleware_class=CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(BaseAppException, app_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

app.include_router(metadata.router)
app.include_router(periodicity.router)
app.include_router(download.router)
app.include_router(layers.router)
app.include_router(shares.router)
app.include_router(embed.router)
app.include_router(embed_marco.router)
app.include_router(embed_telemetria.router)
app.include_router(municipios.router)
app.include_router(client_errors.router)
app.include_router(catalogo.router)
app.include_router(sesion.router)
app.include_router(privado.router)


@app.get('/')
def root():
    return {'message':'MapaLab Backend API'}

@app.get('/health')
def health_check():
    return {'message':'ok'}


@app.get('/ontoy')
def ontoy():
    import app.__version__ as version_module
    from datetime import datetime, timezone

    checks = {}
    try:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            session.execute(text('SELECT 1'))
        checks['db'] = {'status': 'ok'}
    except Exception as exc:
        checks['db'] = {'status': 'down', 'detail': str(exc)[:120]}

    checks['client_errors'] = client_error_snapshot()
    checks['embeds'] = embed_abuse_snapshot()

    severity = {'ok': 0, 'degraded': 1, 'down': 2}
    status = max(
        (c['status'] for c in checks.values()),
        key=lambda s: severity.get(s, 0),
        default='ok',
    )

    try:
        mtime = os.path.getmtime(version_module.__file__)
        deployed_at = datetime.fromtimestamp(mtime, tz=timezone.utc) \
            .isoformat(timespec='seconds').replace('+00:00', 'Z')
    except OSError:
        deployed_at = None

    payload = {
        'slug': 'mapalab-backend',
        'label': 'MapaLab Backend',
        'version': version_module.__version__,
        'deployed_at': deployed_at,
        'status': status,
        'checks': checks,
    }
    return JSONResponse(payload, status_code=503 if status == 'down' else 200)
