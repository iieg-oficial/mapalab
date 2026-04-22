import os
import fcntl
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from app.routers import (metadata, periodicity, download)
from app.exceptions.common_exceptions import BaseAppException
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
    yield
    if is_leader:
        SchedulerService.stop_scheduler()
        if _lock_file:
            _lock_file.close()


app = FastAPI(
    title = "MAPALB",
    lifespan=lifespan,
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

app.add_exception_handler(BaseAppException, app_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

app.include_router(metadata.router)
app.include_router(periodicity.router)
app.include_router(download.router)
@app.get('/')
def root():
    return {'message':'MapaLab Backend API'}

@app.get('/health')
def health_check():
    return {'message':'ok'}
