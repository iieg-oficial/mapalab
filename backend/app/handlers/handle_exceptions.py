from fastapi import Request
from fastapi.responses import JSONResponse
from app.exceptions.common_exceptions import BaseAppException
from app.utils.logger import Logger

async def app_exception_handler(request: Request, exc: BaseAppException):
    Logger.error(f"{exc.status_code} - {exc.message} - Path: {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

async def general_exception_handler(request: Request, exc: Exception):
    Logger.error(f"Unhandled exception: {str(exc)} - Path: {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
