from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (metadata, search, periodicity)
from app.exceptions.common_exceptions import BaseAppException
from app.services.scheduler_service import SchedulerService
from app.services.periodicity_service import PeriodicityService
from app.config import settings
from app.handlers.handle_exceptions import (
    app_exception_handler,
    general_exception_handler
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    PeriodicityService.ensure_schema()
    SchedulerService.start_scheduler()
    yield
    SchedulerService.stop_scheduler()


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
@app.get('/')
def root():
    return {'message':'MapaLab Backend API'}

@app.get('/health')
def health_check():
    return {'message':'ok'}
