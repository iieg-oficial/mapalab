import os
import fcntl
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (metadata, search, periodicity, download)
from app.exceptions.common_exceptions import BaseAppException
from app.services.scheduler_service import SchedulerService
from app.services.periodicity_service import PeriodicityService
from app.config import settings
from app.utils.logger import Logger
from app.handlers.handle_exceptions import (
    app_exception_handler,
    general_exception_handler
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
app.include_router(search.router)
app.include_router(periodicity.router)
app.include_router(download.router)
@app.get('/')
def root():
    return {'message':'MapaLab Backend API'}

@app.get('/health')
def health_check():
    return {'message':'ok'}
