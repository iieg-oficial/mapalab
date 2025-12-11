from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import mapalab
from app.exceptions.common_exceptions import BaseAppException
from app.handlers.handle_exceptions import (
    app_exception_handler,
    general_exception_handler
    )
from app.config import settings

app = FastAPI(
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

app.include_router(mapalab.router)

@app.get('/')
def root():
    return {'message':'MapaLab Backend API'}

@app.get('/health')
def health_check():
    return {'message':'ok'}
